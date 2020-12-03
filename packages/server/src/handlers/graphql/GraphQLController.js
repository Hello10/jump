import {isFunction, get} from 'lodash';

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

  get collection () {
    return this.getCollection(this.name);
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

  load ({collection, path}) {
    return (request)=> {
      const loader = request.context.getLoader(collection);
      const id = get(request, path);
      return id ? loader.load(id) : null;
    };
  }

  loadMany ({collection, path}) {
    return (request)=> {
      const loader = request.context.getLoader(collection);
      const ids = get(request, path);
      return ids.length ? loader.loadMany(ids) : [];
    };
  }

  resolveType (getType) {
    return (request)=> {
      const type = getType(request);
      return request.info.schema.getType(type);
    };
  }

  stub () {
    throw new Error('Unimplemented stub');
  }

  addSessionUserId (key) {
    return ({data, context})=> {
      return {
        ...data,
        [key]: context.user.id
      };
    };
  }

  pass ({obj, info}) {
    const attr = info.fieldName;
    return obj[attr];
  }

  polyRef ({obj, info, context}) {
    const {fieldName: name} = info;
    const type = obj[`${name}_type`];
    const id = obj[`${name}_id`];
    if (!(type && id)) {
      return null;
    }
    const Loader = context.getLoader(type);
    return Loader.load(id);
  }

  ///////////////////////
  // Generic Resolvers //
  ///////////////////////

  exists = this._toCollection('exists');
  list   = this._toCollection('list');
  create = this._wrapToCollection('create');
  update = this._wrapToCollection('update');
  delete = this._wrapToCollection('delete')

  get = this.load({
    collection: this.name,
    path: 'args.id'
  });

  _toCollection (method) {
    return (request)=> {
      return this.collection[method](request.args);
    };
  }

  _wrapToCollection (method) {
    const cmethod = capitalize(method);
    const before = `before${cmethod}`;
    const after = `after${cmethod}`;

    return async (request)=> {
      const {args = {}} = request;

      let {data} = args;
      if (this[before]) {
        data = await this[before]({...request, data});
      }

      let doc = await this.collection[method]({...args, data});
      if (this[after]) {
        const result = await this[after]({...request, data, doc});
        if (result !== undefined) {
          doc = result;
        }
      }

      return doc;
    };
  }
}
