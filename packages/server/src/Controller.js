import {isFunction} from 'lodash';
import Logger from '@hello10/logger';
import {
  GraphQLError,
  NotAuthorizedError
} from './Errors';

// to: helpers
function capitalize (str) {
  return str[0].toUpperCase() + str.slice(1);
}

const APOLLO_UNION_RESOLVER_NAME = '__resolveType';

export default class Controller {
  constructor (options) {
    this.options = options;
    let {logger} = options;
    if (!logger) {
      logger = new Logger('jump:controller');
    }
    this.logger = logger;
  }

  get name () {
    throw new Error('Child class must implement .name');
  }

  static resolvers () {
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

  collection ({context, name}) {
    return context.getCollection(name || this.name);
  }

  loader ({context, name}) {
    return context.getLoader(name || this.name);
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
          logger.debug(`Calling resolver ${path}`);

          try {
            const {user} = context;
            const params = {obj, args, context, info, user};

            // Have to handle this explicitly, would be better to have
            // this in context build derp meh
            const {load_user_error} = context;
            if (load_user_error) {
              throw load_user_error;
            }

            const res_logger = logger.child({
              resolver: name,
              type,
              user
            });

            const authorized = await authorizer.call(this, params);
            if (!authorized) {
              const error = new NotAuthorizedError({path});
              res_logger.error(error);
              throw error;
            }

            res_logger.info('Calling resolver', {obj, args});
            return resolver.call(this, params);
          } catch (error) {
            if (error.expected) {
              logger.error('Expected GraphQL error', error);
              throw error;
            } else {
              logger.error('Unexpected GraphQL error', error);
              throw new GraphQLError();
            }
          }
        };
      }
    }
    return result;
  }


  ///////////////////////
  // Generic Resolvers //
  ///////////////////////
  // Delegate all the reads derp
  // TODO: move to loop at end adding to proto
  exists = this._toCollection('exists');
  get = this._toCollection('get');
  list = this._toCollection('list');
  delete = this._wrapCollection('delete');
  create = this._wrapToCollection('create')
  set = this._wrapToCollection('set');

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
}
