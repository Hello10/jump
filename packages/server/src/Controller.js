import {isFunction} from 'lodash';
import Logger from './Logger';
import {
  GraphQLError,
  NotAuthorizedError
} from './Errors';

const APOLLO_UNION_RESOLVER_NAME = '__resolveType';

export default class Controller {
  constructor ({logger} = {}) {
    if (!logger) {
      logger = new Logger();
    }
    this.logger = logger;
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

  collection ({context, name}) {
    return context.getCollection(name || this.name);
  }

  loader ({context, name}) {
    return context.getLoader(name || this.name);
  }

  expose () {
    const result = {};
    const {logger} = this;

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

        const {resolver, authorizer} = definition;

        const valid = [resolver, authorizer].every(isFunction);
        if (!valid) {
          throw new Error(`Invalid resolver definition for ${path}`);
        }

        result[type][name] = async (obj, args, context, info)=> {
          logger.debug(`Calling resolver ${path}`);

          try {
            const params = {obj, args, context, info};

            const {load_user_error} = context;
            if (load_user_error) {
              throw load_user_error;
            }

            const authorized = await authorizer.call(this, params);
            if (!authorized) {
              throw new NotAuthorizedError({path});
            }

            return resolver.call(this, params);
          } catch (error) {
            if (error.expected) {
              logger.error(error, 'Expected GraphQL error');
              throw error;
            } else {
              logger.error(error, 'Unexpected GraphQL error');
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

  get (request) {
    const collection = this.collection(request);
    return collection.get(request.args);
  }

  list (request) {
    const collection = this.collection(request);
    return collection.list(request.args);
  }

  create (request) {
    const collection = this.collection(request);
    const {data} = request.args;
    return collection.add(data);
  }

  update (request) {
    const collection = this.collection(request);
    const {id, data} = request.args;
    return collection.set({id, data});
  }

  delete (request) {
    const collection = this.collection(request);
    const {id} = request.args;
    return collection.delete({id});
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
