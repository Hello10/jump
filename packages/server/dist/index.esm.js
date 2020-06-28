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

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
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

function _catch(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
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
    const _this = this;

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

        result[type][name] = function (obj, args, context, info) {
          try {
            logger.debug(`Calling resolver ${path}`);
            return Promise.resolve(_catch(function () {
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
              return Promise.resolve(authorizer.call(_this, params)).then(function (authorized) {
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
              });
            }, function (error) {
              if (error.expected) {
                logger.error('Expected GraphQL error', error);
                throw error;
              } else {
                logger.error('Unexpected GraphQL error', error);
                throw new GraphQLError();
              }
            }));
          } catch (e) {
            return Promise.reject(e);
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
    const _this2 = this;

    const cmethod = capitalize(method);
    const before = `before${cmethod}`;
    const after = `after${cmethod}`;
    return function (request) {
      try {
        function _temp3() {
          return Promise.resolve(collection[method]({
            data
          })).then(function (doc) {
            const _temp = function () {
              if (_this2[after]) {
                return Promise.resolve(_this2[after](_extends({}, request, {
                  data,
                  doc
                }))).then(function (_this2$after) {
                  doc = _this2$after;
                });
              }
            }();

            return _temp && _temp.then ? _temp.then(function () {
              return doc;
            }) : doc;
          });
        }

        const collection = _this2.collection(request);

        let {
          data
        } = request.args;

        const _temp2 = function () {
          if (_this2[before]) {
            return Promise.resolve(_this2[before](request)).then(function (_this2$before) {
              data = _this2$before;
            });
          }
        }();

        return Promise.resolve(_temp2 && _temp2.then ? _temp2.then(_temp3) : _temp3(_temp2));
      } catch (e) {
        return Promise.reject(e);
      }
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

  add({
    data
  }) {
    try {
      const _this = this;

      data = omit(data, 'id');

      const timestamp = _this._timestampField();

      data.created_at = timestamp;
      data.updated_at = timestamp;
      return Promise.resolve(_this.collection.add(data)).then(function (ref) {
        data.id = ref.id;
        return data;
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  set({
    id,
    data,
    merge = true
  }) {
    try {
      const _this2 = this;

      data = omit(data, 'id');
      data.updated_at = _this2._timestampField();

      const ref = _this2.doc(id);

      return Promise.resolve(ref.set(data, {
        merge
      })).then(function () {
        return _this2.get({
          id
        });
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  addOrSetByField({
    field,
    data,
    add = x => x
  }) {
    try {
      const _this3 = this;

      const value = data[field];
      return Promise.resolve(_this3.findOneByField(field)(value)).then(function (doc) {
        if (doc) {
          const {
            id
          } = doc;
          return _this3.set({
            id,
            data
          });
        } else {
          return Promise.resolve(add(data)).then(function (_add) {
            data = _add;
            return _this3.add({
              data
            });
          });
        }
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  getOrAddById({
    id,
    data,
    add = x => x
  }) {
    try {
      const _this4 = this;

      return Promise.resolve(_this4.get({
        id
      })).then(function (user) {
        const _temp = function () {
          if (!user) {
            return Promise.resolve(add(data)).then(function (_add2) {
              data = _add2;
              return Promise.resolve(_this4.set({
                id,
                data,
                merge: false
              })).then(function (_this4$set) {
                user = _this4$set;
              });
            });
          }
        }();

        return _temp && _temp.then ? _temp.then(function () {
          return user;
        }) : user;
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  exists({
    id
  }) {
    try {
      const _this5 = this;

      const ref = _this5.doc(id);

      return Promise.resolve(ref.get()).then(function (snap) {
        return snap.exists;
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  get({
    id,
    safe = false
  }) {
    try {
      const _this6 = this;

      const ref = _this6.doc(id);

      return Promise.resolve(ref.get()).then(function (snap) {
        if (safe && !snap.exists) {
          const type = _this6.name();

          throw new DocumentDoesNotExistError({
            type,
            id
          });
        }

        return _this6._snapToDoc(snap);
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  getAssert({
    id
  }) {
    try {
      const _this7 = this;

      return Promise.resolve(_this7.get({
        id,
        safe: true
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  getMany({
    ids
  }) {
    try {
      const _this8 = this;

      if (!ids || ids.length === 0) {
        return Promise.resolve([]);
      }

      const uniques = uniq(ids);
      const refs = uniques.map(id => _this8.doc(id));
      return Promise.resolve(_this8.firestore.getAll(refs)).then(function (snaps) {
        const docs = snaps.map(snap => _this8._snapToDoc(snap));
        const docs_by_id = {};

        for (const doc of docs) {
          if (doc) {
            docs_by_id[doc.id] = doc;
          }
        }

        return ids.map(id => {
          return id in docs_by_id ? docs_by_id[id] : null;
        });
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  find({
    where,
    limit,
    order_by,
    select
  } = {}) {
    try {
      const _this9 = this;

      function invalid(field) {
        throw new Error(`Invalid ${field} for find`);
      }

      let query = _this9.collection;

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

      return Promise.resolve(query.get()).then(function (snap) {
        return snap.docs.map(_this9._snapToDoc);
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  findOne({
    where,
    order_by,
    select
  }) {
    try {
      const _this10 = this;

      return Promise.resolve(_this10.find({
        limit: 1,
        where,
        order_by,
        select
      })).then(function (docs) {
        return docs.length > 0 ? docs[0] : null;
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  findOneByField(field) {
    return value => {
      return this.findOne({
        where: [field, '==', value]
      });
    };
  }

  delete({
    id,
    ids,
    where
  }) {
    try {
      const _this11 = this;

      function _temp3() {
        if (ids.length === 0) {
          return Promise.resolve();
        }

        const batch = _this11.firestore.batch();

        for (const id of ids) {
          const ref = _this11.doc(id);

          batch.delete(ref);
        }

        return batch.commit();
      }

      if (id) {
        const ref = _this11.doc(id);

        return Promise.resolve(ref.delete());
      }

      if (ids && where) {
        throw new Error('Delete call should pass ids or where not both');
      }

      const _temp2 = function () {
        if (where) {
          return Promise.resolve(_this11.find({
            where
          })).then(function (docs) {
            ids = docs.map(({
              id
            }) => id);
          });
        }
      }();

      return Promise.resolve(_temp2 && _temp2.then ? _temp2.then(_temp3) : _temp3(_temp2));
    } catch (e) {
      return Promise.reject(e);
    }
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

function _catch$1(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
}

function contextBuilder({
  Collections,
  getToken,
  loadUserFromToken,
  options
}) {
  return function ({
    req
  }) {
    try {
      function _temp3() {
        return _extends({
          getCollection,
          getLoader,
          token,
          user_id,
          user,
          load_user_error
        }, options);
      }

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

        return Collection.get(_extends({
          getCollection,
          getLoader
        }, options));
      }

      const loaders = {};
      let user_id = null;
      let user = null;
      let load_user_error = null;
      const token = getToken(req);

      const _temp2 = function () {
        if (token) {
          const _temp = _catch$1(function () {
            return Promise.resolve(loadUserFromToken({
              token,
              getCollection
            })).then(function (_loadUserFromToken) {
              ({
                user_id,
                user
              } = _loadUserFromToken);
            });
          }, function (error) {
            console.error(error);
            load_user_error = error;
          });

          if (_temp && _temp.then) return _temp.then(function () {});
        }
      }();

      return Promise.resolve(_temp2 && _temp2.then ? _temp2.then(_temp3) : _temp3(_temp2));
    } catch (e) {
      return Promise.reject(e);
    }
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
  const server = new ApolloServer(_extends({}, opts_server, {
    schema
  }));
  return server.createHandler(opts_handler);
}

export { Authorizers, Collection, Controller, FirestoreCollection, GraphQLError, graphqlHandler };
//# sourceMappingURL=index.esm.js.map
