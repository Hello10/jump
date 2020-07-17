import {isFunction} from 'lodash';

import initialize from '../../initialize';
import {
  GraphQLError,
  NotAuthorizedError
} from '../../Errors';

// to: helpers
function capitalize (str) {
  return str[0].toUpperCase() + str.slice(1);
}

const APOLLO_UNION_RESOLVER_NAME = '__resolveType';

export default class GraphQLController {
  constructor (options) {
    // Only initialize if options are passed (we skip when building schema)
    if (options) {
      initialize.call(this, {namespace: 'GraphQLController', ...options});
    }
  }

  get name () {
    throw new Error('Child class must implement .name');
  }

  resolvers () {
    // Child class should implement this method and return
    // an object with this shape:
    //
    // {
    //   // Mutations resolved in this controller
    //   Mutation: {
    //     <MutationName>: {
    //       resolver: Function,
    //       authorizer: Function
    //     }
    //   },
    //   // Queries resolved in this controller
    //   Query: {
    //     <QueryName>: {
    //       resolver: Function,
    //       authorizer: Function
    //     }
    //   },
    //   // Type fields resolved in this controller
    //   <TypeName>: {
    //     <FieldName>: {
    //       resolver: Function,
    //       authorizer: Function
    //     }
    //   },
    //   <UnionTypeName>: {
    //     __resolveType: Function
    //   }
    // }
    throw new Error('Child class must implement .resolvers');
  }

  collection (name) {
    return this.getCollection(name || this.name);
  }

  expose () {
    const {logger} = this;

    const result = {};

    const groups = this.resolvers();
    for (const [type, group] of Object.entries(groups)) {
      if (!(type in result)) {
        result[type] = {};
      }

      for (const [name, definition] of Object.entries(group)) {
        const path = `${type}.${name}`;

        // Resolve Union types
        // https://www.apollographql.com/docs/graphql-tools/resolvers/#unions-and-interfaces
        if (name === APOLLO_UNION_RESOLVER_NAME) {
          result[type][name] = (obj, context, info)=> {
            return definition.call(this, {obj, context, info});
          };
          continue;
        }

        // This seems like a dumb idea unless there's some dynmamic thing that
        // is difficult to do without this..
        // let the resolvers and permission be specified as strings
        // for (const [k, v] of Object.entries(config)) {
        //   if (Type(v, String)) {
        //     config[k] = this[v];
        //   }
        // }

        for (const field of ['authorizer', 'resolver']) {
          if (!isFunction(definition[field])) {
            throw new Error(`Invalid ${field} definition for ${path}`);
          }
        }

        const {resolver, authorizer} = definition;
        result[type][name] = async (obj, args, context, info)=> {
          const {user} = context;
          const params = {obj, args, context, info, user};

          const rlogger = logger.child({
            resolver: name,
            type,
            user,
            obj,
            args
          });

          rlogger.debug(`Calling resolver ${path}`);

          try {
            // Have to handle this explicitly, would be better to have
            // this in context build derp meh
            const {load_user_error} = context;
            if (load_user_error) {
              throw load_user_error;
            }

            const authorized = await authorizer.call(this, params);
            if (!authorized) {
              const error = new NotAuthorizedError({path});
              rlogger.error(error);
              throw error;
            }

            const result = await resolver.call(this, params);
            rlogger.info('Resolver result', {result});
            return result;
          } catch (error) {
            if (error.expected) {
              rlogger.error('Expected GraphQL error', error);
              throw error;
            } else {
              rlogger.error(error);
              throw new GraphQLError();
            }
          }
        };
      }
    }
    return result;
  }

  load ({collection, field}) {
    return ({obj, context})=> {
      const loader = context.getLoader(collection);
      const id = obj[field];
      return id ? loader.load(id) : null;
    };
  }

  loadMany ({collection, field}) {
    return ({obj, context})=> {
      const loader = context.getLoader(collection);
      const ids = obj[field];
      return ids.length ? loader.loadMany(ids) : [];
    };
  }

  resolveType (getType) {
    return ({obj, info})=> {
      const type = getType(obj);
      return info.schema.getType(type);
    };
  }

  stub () {
    throw new Error('Unimplemented stub');
  }

  ///////////////////////
  // Generic Resolvers //
  ///////////////////////

  exists = this._toCollection('exists');
  get    = this._toCollection('get');
  list   = this._toCollection('list');
  create = this._wrapToCollection('create')
  update = this._wrapToCollection('update');

  async delete (request) {
    if (this.beforeDelete) {
      await this.beforeDelete(request);
    }

    const {id} = request.args;
    const collection = this.collection(request);
    const deleted = await collection.delete({id});
    const deleted_at = new Date();

    if (this.afterDelete) {
      await this.afterDelete({...request, deleted, deleted_at});
    }

    return {deleted_at, deleted};
  }

  _toCollection (method) {
    return (request)=> {
      const collection = this.collection(request);
      return collection[method](request.args);
    };
  }

  _wrapToCollection (method) {
    const cmethod = capitalize(method);
    const before = `before${cmethod}`;
    const after = `after${cmethod}`;

    return async (request)=> {
      const collection = this.collection(request);

      let {data} = request.args;
      if (this[before]) {
        data = await this[before](request);
      }

      let doc = await collection[method]({data});
      if (this[after]) {
        doc = await this[after]({...request, data, doc});
      }

      return doc;
    };
  }
}
