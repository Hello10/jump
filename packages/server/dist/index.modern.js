import DataLoader from 'dataloader';
import { isFunction, omit, uniq, isObject, isNumber, merge } from 'lodash';
import Logger from '@hello10/logger';
import { ApolloError, ApolloServer } from 'apollo-server-cloud-functions';
import { makeExecutableSchema } from 'graphql-tools';
import makeDebug from 'debug';

function isExisting({
  context
}) {
  return !!context.user;
}
function isSignedIn({
  context
}) {
  return !!context.user_id;
}
function isPublic() {
  return true;
}

var Authorizers = {
  __proto__: null,
  isExisting: isExisting,
  isSignedIn: isSignedIn,
  isPublic: isPublic
};

class Collection {
  static get(args) {
    return new this(args);
  }

  get name() {
    throw new Error('Collection child class must implement .name');
  }

  get collection() {
    throw new Error('Collection child class must implement .collection');
  }

  get loader() {
    return new DataLoader(ids => {
      return this.getMany({
        ids
      });
    });
  }

  create() {
    throw new Error('Collection child class must implement .create');
  }

  exists() {
    throw new Error('Collection child class must implement .exists');
  }

  get() {
    throw new Error('Collection child class must implement .get');
  }

  getSafe({
    id
  }) {
    return this.get({
      id,
      safe: true
    });
  }

  getMany() {
    throw new Error('Collection child class must implement .getMany');
  }

  getManySafe({
    ids
  }) {
    return this.getMany({
      ids,
      safe: true
    });
  }

  find() {}

  set() {
    throw new Error('Collection child class must implement .set');
  }

  setSafe({
    id,
    data
  }) {
    return this.setMany({
      id,
      data,
      safe: true
    });
  }

  merge() {
    throw new Error('Collection child class must implement .merge');
  }

  mergeSafe({
    id,
    data
  }) {
    return this.merge({
      id,
      data,
      safe: true
    });
  }

  delete() {
    throw new Error('Collection child class must implement .delete');
  }

  deleteSafe({
    id
  }) {
    return this.delete({
      id,
      safe: true
    });
  }

}

class GraphQLError extends ApolloError {
  constructor({
    code = 'GraphQLError',
    message = 'GraphQL error',
    params
  }) {
    if (message.constructor === Function) {
      message = message(params);
    }

    super(message, code, params);
    this.expected = true;
  }

  is(code) {
    return this.code === code;
  }

}
class DocumentDoesNotExistError extends GraphQLError {
  constructor(params) {
    const {
      type,
      id
    } = params;
    super({
      code: 'DocumentDoesNotExist',
      message: `Document ${type} with id ${id} does not exist`,
      params
    });
  }

}
class NotAuthorizedError extends GraphQLError {
  constructor(params) {
    super({
      code: 'NotAuthorized',
      message: `Not authorized to access ${params.path}`,
      params
    });
  }

}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

const APOLLO_UNION_RESOLVER_NAME = '__resolveType';
class Controller {
  constructor(options) {
    this.exists = this._toCollection('exists');
    this.get = this._toCollection('get');
    this.list = this._toCollection('list');
    this.delete = this._wrapCollection('delete');
    this.create = this._wrapToCollection('create');
    this.set = this._wrapToCollection('set');
    this.options = options;
    let {
      logger
    } = options;

    if (!logger) {
      logger = new Logger('jump:controller');
    }

    this.logger = logger;
  }

  get name() {
    throw new Error('Child class must implement .name');
  }

  static resolvers() {
    throw new Error('Child class must implement .resolvers');
  }

  collection({
    context,
    name
  }) {
    return context.getCollection(name || this.name);
  }

  loader({
    context,
    name
  }) {
    return context.getLoader(name || this.name);
  }

  expose() {
    var _this = this;

    const {
      logger
    } = this;
    const result = {};
    const groups = this.resolvers();

    for (const [type, group] of Object.entries(groups)) {
      if (!(type in result)) {
        result[type] = {};
      }

      for (const [name, definition] of Object.entries(group)) {
        const path = `${type}.${name}`;

        if (name === APOLLO_UNION_RESOLVER_NAME) {
          result[type][name] = (obj, context, info) => {
            return definition.call(this, {
              obj,
              context,
              info
            });
          };

          continue;
        }

        for (const field of ['authorizer', 'resolver']) {
          if (!isFunction(definition[field])) {
            throw new Error(`Invalid ${field} definition for ${path}`);
          }
        }

        const {
          resolver,
          authorizer
        } = definition;

        result[type][name] = async function (obj, args, context, info) {
          logger.debug(`Calling resolver ${path}`);

          try {
            const {
              user
            } = context;
            const params = {
              obj,
              args,
              context,
              info,
              user
            };
            const {
              load_user_error
            } = context;

            if (load_user_error) {
              throw load_user_error;
            }

            const res_logger = logger.child({
              resolver: name,
              type,
              user
            });
            const authorized = await authorizer.call(_this, params);

            if (!authorized) {
              const error = new NotAuthorizedError({
                path
              });
              res_logger.error(error);
              throw error;
            }

            res_logger.info('Calling resolver', {
              obj,
              args
            });
            return resolver.call(_this, params);
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

  _toCollection(method) {
    return request => {
      const collection = this.collection(request);
      return collection[method](request.args);
    };
  }

  _wrapToCollection(method) {
    var _this2 = this;

    const cmethod = capitalize(method);
    const before = `before${cmethod}`;
    const after = `after${cmethod}`;
    return async function (request) {
      const collection = _this2.collection(request);

      let {
        data
      } = request.args;

      if (_this2[before]) {
        data = await _this2[before](request);
      }

      let doc = await collection[method]({
        data
      });

      if (_this2[after]) {
        doc = await _this2[after]({ ...request,
          data,
          doc
        });
      }

      return doc;
    };
  }

  load({
    collection,
    field
  }) {
    return ({
      obj,
      context
    }) => {
      const loader = context.getLoader(collection);
      const id = obj[field];
      return id ? loader.load(id) : null;
    };
  }

  loadMany({
    collection,
    field
  }) {
    return ({
      obj,
      context
    }) => {
      const loader = context.getLoader(collection);
      const ids = obj[field];
      return ids.length ? loader.loadMany(ids) : [];
    };
  }

  resolveType(getType) {
    return ({
      obj,
      info
    }) => {
      const type = getType(obj);
      return info.schema.getType(type);
    };
  }

  stub() {
    throw new Error('Unimplemented stub');
  }

}

function timestampsToDates(obj) {
  if (!obj) {
    return obj;
  }

  const type = obj.constructor.name;

  switch (type) {
    case 'Array':
      return obj.map(timestampsToDates);

    case 'Object':
      return Object.keys(obj).reduce((result, k) => {
        result[k] = timestampsToDates(obj[k]);
        return result;
      }, {});

    case 'Timestamp':
      return obj.toDate();

    default:
      return obj;
  }
}

class FirestoreCollection extends Collection {
  constructor({
    Admin,
    app,
    getCollection,
    getLoader
  }) {
    super();
    this.Admin = Admin;
    this.app = app;
    this.getCollection = getCollection;
    this.getLoader = getLoader;
  }

  get auth() {
    return this.app.auth();
  }

  get collection() {
    return this.app.firestore().collection(this.name);
  }

  doc(id) {
    return this.collection.doc(id);
  }

  async add({
    data
  }) {
    data = omit(data, 'id');

    const timestamp = this._timestampField();

    data.created_at = timestamp;
    data.updated_at = timestamp;
    const ref = await this.collection.add(data);
    data.id = ref.id;
    return data;
  }

  async set({
    id,
    data,
    merge = true
  }) {
    data = omit(data, 'id');
    data.updated_at = this._timestampField();
    const ref = this.doc(id);
    await ref.set(data, {
      merge
    });
    return this.get({
      id
    });
  }

  async addOrSetByField({
    field,
    data,
    add = x => x
  }) {
    const value = data[field];
    const doc = await this.findOneByField(field)(value);

    if (doc) {
      const {
        id
      } = doc;
      return this.set({
        id,
        data
      });
    } else {
      data = await add(data);
      return this.add({
        data
      });
    }
  }

  async getOrAddById({
    id,
    data,
    add = x => x
  }) {
    let user = await this.get({
      id
    });

    if (!user) {
      data = await add(data);
      user = await this.set({
        id,
        data,
        merge: false
      });
    }

    return user;
  }

  async exists({
    id
  }) {
    const ref = this.doc(id);
    const snap = await ref.get();
    return snap.exists;
  }

  async get({
    id,
    safe = false
  }) {
    const ref = this.doc(id);
    const snap = await ref.get();

    if (safe && !snap.exists) {
      const type = this.name();
      throw new DocumentDoesNotExistError({
        type,
        id
      });
    }

    return this._snapToDoc(snap);
  }

  async getAssert({
    id
  }) {
    return this.get({
      id,
      safe: true
    });
  }

  async getMany({
    ids
  }) {
    if (!ids || ids.length === 0) {
      return [];
    }

    const uniques = uniq(ids);
    const refs = uniques.map(id => this.doc(id));
    const snaps = await this.firestore.getAll(refs);
    const docs = snaps.map(snap => this._snapToDoc(snap));
    const docs_by_id = {};

    for (const doc of docs) {
      if (doc) {
        docs_by_id[doc.id] = doc;
      }
    }

    return ids.map(id => {
      return id in docs_by_id ? docs_by_id[id] : null;
    });
  }

  async find({
    where,
    limit,
    order_by,
    select
  } = {}) {
    let query = this.collection;

    function invalid(field) {
      throw new Error(`Invalid ${field} for find`);
    }

    if (where) {
      let parts;

      if (isObject(where)) {
        parts = Object.entries(where).map(([field, value]) => {
          return [field, '==', value];
        });
      } else if (Array.isArray(where)) {
        parts = Array.isArray(where[0]) ? where : [where];
      } else {
        invalid('where');
      }

      for (const part of parts) {
        if (part.length !== 3) {
          invalid('where');
        }

        const [field, op, value] = part;
        query = query.where(field, op, value);
      }
    }

    if (order_by) {
      if (!Array.isArray(order_by)) {
        order_by = [order_by];
      }

      query = query.orderBy(...order_by);
    }

    if (limit) {
      if (!isNumber(limit)) {
        invalid('limit');
      }

      query = query.limit(limit);
    }

    if (select) {
      if (!Array.isArray(select)) {
        invalid('select');
      }

      query = query.select(...select);
    }

    const snap = await query.get();
    return snap.docs.map(this._snapToDoc);
  }

  async findOne({
    where,
    order_by,
    select
  }) {
    const docs = await this.find({
      limit: 1,
      where,
      order_by,
      select
    });
    return docs.length > 0 ? docs[0] : null;
  }

  findOneByField(field) {
    return value => {
      return this.findOne({
        where: [field, '==', value]
      });
    };
  }

  async delete({
    id,
    ids,
    where
  }) {
    if (id) {
      const ref = this.doc(id);
      return ref.delete();
    }

    if (ids && where) {
      throw new Error('Delete call should pass ids or where not both');
    }

    if (where) {
      const docs = await this.find({
        where
      });
      ids = docs.map(({
        id
      }) => id);
    }

    if (ids.length === 0) {
      return Promise.resolve();
    }

    const batch = this.firestore.batch();

    for (const _id of ids) {
      const ref = this.doc(_id);
      batch.delete(ref);
    }

    return batch.commit();
  }

  _timestampField() {
    return this.Admin.firestore.FieldValue.serverTimestamp();
  }

  _deleteField() {
    return this.Admin.firestore.FieldValue.delete();
  }

  _snapToDoc(snap) {
    if (snap.exists) {
      const data = snap.data();
      data.id = snap.id;
      return timestampsToDates(data);
    } else {
      return null;
    }
  }

  _id() {
    const ref = this.collection.doc();
    return ref.id;
  }

}

const debug = makeDebug('jump');

function makeSchema({
  Schema,
  Controllers,
  Scalars,
  options
}) {
  const resolvers = {};

  for (const [name, Controller] of Object.entries(Controllers)) {
    debug(`Exposing controller ${name}`);
    const controller = new Controller(options);
    merge(resolvers, controller.expose());
  }

  merge(resolvers, Scalars);
  return makeExecutableSchema({
    typeDefs: Schema,
    resolvers
  });
}

function contextBuilder({
  Collections,
  getToken,
  loadUserFromToken,
  options
}) {
  return async ({
    req
  }) => {
    const loaders = {};

    function getLoader(arg) {
      const name = arg.name || arg;

      if (!(name in loaders)) {
        const collection = getCollection(name);
        loaders[name] = collection.loader;
      }

      return loaders[name];
    }

    function getCollection(arg) {
      const name = arg.name || arg;
      const Collection = Collections[name];

      if (!Collection) {
        throw new Error(`Collection with name ${name} does not exist`);
      }

      return Collection.get({
        getCollection,
        getLoader,
        ...options
      });
    }

    let user_id = null;
    let user = null;
    let load_user_error = null;
    const token = getToken(req);

    if (token) {
      try {
        ({
          user_id,
          user
        } = await loadUserFromToken({
          token,
          getCollection
        }));
      } catch (error) {
        console.error(error);
        load_user_error = error;
      }
    }

    return {
      getCollection,
      getLoader,
      token,
      user_id,
      user,
      load_user_error,
      ...options
    };
  };
}

function getTokenDefault(request) {
  const header = request.get('Authorization');
  const prefix = /^Bearer /;

  if (header && header.match(prefix)) {
    return header.replace(prefix, '');
  } else {
    return null;
  }
}

function graphqlHandler({
  Collections,
  Controllers,
  Scalars,
  Schema,
  getToken = getTokenDefault,
  loadUserFromToken,
  options = {}
}) {
  const {
    server: opts_server = {},
    handler: opts_handler = {},
    context: opts_context = {}
  } = options;

  if (!opts_server.context) {
    opts_server.context = contextBuilder({
      options: opts_context,
      Collections,
      getToken,
      loadUserFromToken
    });
  }

  const schema = makeSchema({
    options: opts_context,
    Schema,
    Controllers,
    Scalars
  });
  const server = new ApolloServer({ ...opts_server,
    schema
  });
  return server.createHandler(opts_handler);
}

export { Authorizers, Collection, Controller, FirestoreCollection, GraphQLError, graphqlHandler };
//# sourceMappingURL=index.modern.js.map
