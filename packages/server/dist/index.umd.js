(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('apollo-server-cloud-functions'), require('dataloader'), require('lodash'), require('bluebird'), require('@hello10/util'), require('@hello10/logger'), require('graphql-tools'), require('graphql'), require('express'), require('cors')) :
  typeof define === 'function' && define.amd ? define(['exports', 'apollo-server-cloud-functions', 'dataloader', 'lodash', 'bluebird', '@hello10/util', '@hello10/logger', 'graphql-tools', 'graphql', 'express', 'cors'], factory) :
  (global = global || self, factory(global.jumpServer = {}, global.apolloServerCloudFunctions, global.dataloader, global.lodash, global.bluebird, global.util, global.Logger, global.graphqlTools, global.graphql, global.express, global.cors));
}(this, (function (exports, apolloServerCloudFunctions, DataLoader, lodash, Promise$1, util, Logger, graphqlTools, GraphQL, Express, Cors) {
  DataLoader = DataLoader && Object.prototype.hasOwnProperty.call(DataLoader, 'default') ? DataLoader['default'] : DataLoader;
  Promise$1 = Promise$1 && Object.prototype.hasOwnProperty.call(Promise$1, 'default') ? Promise$1['default'] : Promise$1;
  Logger = Logger && Object.prototype.hasOwnProperty.call(Logger, 'default') ? Logger['default'] : Logger;
  Express = Express && Object.prototype.hasOwnProperty.call(Express, 'default') ? Express['default'] : Express;
  Cors = Cors && Object.prototype.hasOwnProperty.call(Cors, 'default') ? Cors['default'] : Cors;

  class GraphQLError extends apolloServerCloudFunctions.ApolloError {
    constructor({
      code = 'GraphQLError',
      message = 'GraphQL error',
      params
    } = {}) {
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
  class DoesNotExistError extends GraphQLError {
    constructor(params) {
      super({
        code: 'DoesNotExist',
        message: ({
          type,
          id,
          ids,
          query
        }) => {
          let missing = '';

          if (id) {
            missing = ` for id = ${id}`;
          } else if (ids) {
            missing = ` for ids = [${ids.join(',')}]`;
          } else if (query) {
            missing = ` for query = ${query}`;
          }

          return `Could not find ${type}${missing}`;
        },
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

  var Errors = {
    __proto__: null,
    GraphQLError: GraphQLError,
    DoesNotExistError: DoesNotExistError,
    NotAuthorizedError: NotAuthorizedError
  };

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

  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }

    return target;
  }

  const logger = new Logger('jump');

  function initialize(options) {
    const {
      namespace
    } = options;
    const required = ['Admin', 'app', 'Enums', 'getCollection', 'getService'];

    for (const name of required) {
      if (!options[name]) {
        throw new Error(`Missing required argument for ${namespace}: ${name}`);
      }

      this[name] = options[name];
    }

    let {
      logger: logger$1
    } = options;

    if (!logger$1) {
      logger$1 = logger;
    }

    this.logger = logger$1.child(`${namespace}:${this.name}`);
  }

  class Collection {
    constructor(options) {
      initialize.call(this, _extends({
        namespace: 'Collection'
      }, options));
    }

    bucket(name) {
      return this.Admin.storage().bucket(name);
    }

    get name() {
      throw new Error('Collection child class must implement .name');
    }

    get collection() {
      throw new Error('Collection child class must implement .collection');
    }

    create() {
      throw new Error('Collection child class must implement .create');
    }

    createAll({
      datas
    }) {
      return Promise$1.map(datas, data => this.create({
        data
      }));
    }

    findOrCreate({
      query,
      data
    }) {
      try {
        const _this = this;

        return Promise$1.resolve(_this.findOne({
          query
        })).then(function (doc) {
          return doc || _this.create({
            data
          });
        });
      } catch (e) {
        return Promise$1.reject(e);
      }
    }

    exists() {
      throw new Error('Collection child class must implement .exists');
    }

    existsAssert({
      id
    }) {
      return this.exists({
        id,
        assert: true
      });
    }

    existsAll({
      ids,
      assert = false
    }) {
      try {
        const _this2 = this;

        return Promise$1.resolve(_this2.getAll({
          ids,
          assert
        })).then(function (docs) {
          return docs.every(doc => !!doc);
        });
      } catch (e) {
        return Promise$1.reject(e);
      }
    }

    existsAllAssert({
      ids
    }) {
      return this.existsAll({
        ids,
        assert: true
      });
    }

    get() {
      throw new Error('Collection child class must implement .get');
    }

    getAssert({
      id
    }) {
      return this.get({
        id,
        assert: true
      });
    }

    getAll() {
      throw new Error('Collection child class must implement .getAll');
    }

    getAllAssert({
      ids
    }) {
      return this.getAll({
        ids,
        assert: true
      });
    }

    find() {
      throw new Error('Collection child class must implement .find');
    }

    findOne({
      query,
      sort,
      select
    }) {
      try {
        const _this3 = this;

        return Promise$1.resolve(_this3.find({
          limit: 1,
          query,
          sort,
          select
        })).then(function (docs) {
          return docs.length > 0 ? docs[0] : null;
        });
      } catch (e) {
        return Promise$1.reject(e);
      }
    }

    findIds({
      query
    }) {
      try {
        const _this4 = this;

        return Promise$1.resolve(_this4.find({
          query,
          select: ['id']
        })).then(function (docs) {
          return docs.map(({
            id
          }) => id);
        });
      } catch (e) {
        return Promise$1.reject(e);
      }
    }

    list({
      limit,
      sort,
      start_at,
      start_after
    } = {}) {
      try {
        const _this5 = this;

        return Promise$1.resolve(_this5.find({
          limit,
          sort,
          start_at,
          start_after
        }));
      } catch (e) {
        return Promise$1.reject(e);
      }
    }

    update() {
      throw new Error('Collection child class must implement .update');
    }

    updateAssert({
      id,
      data,
      merge = true
    }) {
      return this.update({
        id,
        data,
        merge,
        assert: true
      });
    }

    updateAll({
      ids,
      data,
      merge = true,
      assert = false
    }) {
      try {
        const _this6 = this;

        _this6._addUpdatedAt(data);

        return Promise$1.resolve(Promise$1.map(ids, id => {
          return _this6.update({
            id,
            data,
            merge,
            assert
          });
        }));
      } catch (e) {
        return Promise$1.reject(e);
      }
    }

    updateAllAssert({
      ids,
      data,
      merge = true
    }) {
      return this.update({
        ids,
        data,
        merge,
        assert: true
      });
    }

    updateMany({
      query,
      data,
      merge = true
    }) {
      try {
        const _this7 = this;

        return Promise$1.resolve(_this7.findIds({
          query
        })).then(function (ids) {
          return _this7.updateAll({
            ids,
            data,
            merge
          });
        });
      } catch (e) {
        return Promise$1.reject(e);
      }
    }

    delete() {
      throw new Error('Collection child class must implement .delete');
    }

    deleteAssert({
      id
    }) {
      return this.delete({
        id,
        assert: true
      });
    }

    deleteAll() {
      throw new Error('Collection child class must implement .deleteAll');
    }

    deleteMany({
      query
    }) {
      try {
        const _this8 = this;

        return Promise$1.resolve(_this8.findIds({
          query
        })).then(function (ids) {
          return _this8.deleteAll({
            ids
          });
        });
      } catch (e) {
        return Promise$1.reject(e);
      }
    }

    get loader() {
      const _this9 = this;

      return new DataLoader(function (ids) {
        try {
          _this9.logger.debug({
            message: `calling DataLoader for ${_this9.name}`,
            ids
          });

          return Promise$1.resolve(_this9.getAll({
            ids
          })).then(function (docs) {
            const lookup = new Map();

            for (const doc of docs) {
              lookup.set(doc.id, doc);
            }

            return ids.map(id => {
              return lookup.has(id) ? lookup.get(id) : null;
            });
          });
        } catch (e) {
          return Promise$1.reject(e);
        }
      });
    }

    load(id) {
      if (!id) {
        throw new Error('Missing id');
      }

      const loader = this.getLoader(this.name);
      return loader.load(id);
    }

    loadMany(ids) {
      if (!ids.length) {
        return [];
      }

      const loader = this.getLoader(this.name);
      return loader.loadMany(ids);
    }

    loadManyCompact(ids) {
      try {
        const _this10 = this;

        return Promise$1.resolve(_this10.loadMany(ids)).then(lodash.compact);
      } catch (e) {
        return Promise$1.reject(e);
      }
    }

    _timestamp() {
      return new Date();
    }

    _addTimestamps(obj, time) {
      if (!time) {
        time = this._timestamp();
      }

      this._addCreatedAt(obj, time);

      this._addUpdatedAt(obj, time);

      return obj;
    }

    _addCreatedAt(obj, time) {
      if (!('created_at' in obj)) {
        obj.created_at = time || this._timestamp();
      }

      return obj;
    }

    _addUpdatedAt(obj, time) {
      if (!('updated_at' in obj)) {
        obj.updated_at = time || this._timestamp();
      }

      return obj;
    }

  }
  util.singleton(Collection);

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
    constructor(options) {
      super(options);
      const {
        Admin,
        app
      } = options;
      this.Admin = Admin;
      this.app = app;
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

    create({
      data
    }) {
      try {
        const _this = this;

        return Promise.resolve(_this.add({
          data
        }));
      } catch (e) {
        return Promise.reject(e);
      }
    }

    exists({
      id,
      assert = false
    }) {
      try {
        const _this2 = this;

        const ref = _this2.doc(id);

        return Promise.resolve(ref.get()).then(function (snap) {
          const {
            exists
          } = snap;

          if (assert && !exists) {
            const type = _this2.name();

            throw new DoesNotExistError({
              type,
              id
            });
          }

          return exists;
        });
      } catch (e) {
        return Promise.reject(e);
      }
    }

    get({
      id,
      assert = false
    }) {
      try {
        const _this3 = this;

        const ref = _this3.doc(id);

        return Promise.resolve(ref.get()).then(function (snap) {
          if (assert && !snap.exists) {
            const type = _this3.name();

            throw new DoesNotExistError({
              type,
              id
            });
          }

          return _this3._snapToDoc(snap);
        });
      } catch (e) {
        return Promise.reject(e);
      }
    }

    getAll({
      ids,
      assert = false
    }) {
      try {
        const _this4 = this;

        if (!ids || ids.length === 0) {
          return Promise.resolve([]);
        }

        const uniques = lodash.uniq(ids);
        const refs = uniques.map(id => _this4.doc(id));
        return Promise.resolve(_this4.firestore.getAll(refs)).then(function (snaps) {
          const docs = snaps.map(snap => _this4._snapToDoc(snap));
          const docs_by_id = {};

          for (const doc of docs) {
            if (doc) {
              docs_by_id[doc.id] = doc;
            }
          }

          const missing_ids = [];
          const result = ids.map(id => {
            const exists = (id in docs_by_id);

            if (!exists) {
              missing_ids.push(id);
            }

            return exists ? docs_by_id[id] : null;
          });

          if (assert && missing_ids.length) {
            throw new DoesNotExistError({
              type: _this4.name,
              ids: missing_ids
            });
          } else {
            return result;
          }
        });
      } catch (e) {
        return Promise.reject(e);
      }
    }

    find({
      query,
      limit,
      sort,
      start_at,
      start_after,
      select
    } = {}) {
      try {
        const _this5 = this;

        function _temp2() {
          if (limit) {
            if (!lodash.isNumber(limit)) {
              invalid('limit');
            }

            cursor = cursor.limit(limit);
          }

          if (select) {
            if (!Array.isArray(select)) {
              invalid('select');
            }

            cursor = cursor.select(...select);
          }

          return Promise.resolve(cursor.get()).then(function (snap) {
            return snap.docs.map(_this5._snapToDoc);
          });
        }

        function invalid(field) {
          throw new Error(`Invalid ${field} for find`);
        }

        let cursor = _this5.collection;

        if (query) {
          let parts;

          if (lodash.isObject(query)) {
            parts = Object.entries(query).map(([field, value]) => {
              return [field, '==', value];
            });
          } else if (Array.isArray(query)) {
            parts = Array.isArray(query[0]) ? query : [query];
          } else {
            invalid('query');
          }

          for (const part of parts) {
            if (part.length !== 3) {
              invalid('query');
            }

            const [field, op, value] = part;
            cursor = cursor.where(field, op, value);
          }
        }

        if (sort) {
          if (!Array.isArray(sort)) {
            sort = [sort];
          }

          cursor = cursor.orderBy(...sort);
        }

        const start = start_after || start_at;

        const _temp = function () {
          if (start) {
            return Promise.resolve(_this5.doc(start).get()).then(function (doc) {
              const fn = start_after ? 'startAfter' : 'startAt';
              cursor = cursor[fn](doc);
            });
          }
        }();

        return Promise.resolve(_temp && _temp.then ? _temp.then(_temp2) : _temp2(_temp));
      } catch (e) {
        return Promise.reject(e);
      }
    }

    update(args) {
      try {
        const _this6 = this;

        return Promise.resolve(_this6.set(args));
      } catch (e) {
        return Promise.reject(e);
      }
    }

    delete({
      id,
      assert = true
    }) {
      try {
        const _this7 = this;

        function _temp4() {
          const ref = _this7.doc(id);

          return ref.delete();
        }

        const _temp3 = function () {
          if (assert) {
            return Promise.resolve(_this7.existsAssert({
              id
            })).then(function () {});
          }
        }();

        return Promise.resolve(_temp3 && _temp3.then ? _temp3.then(_temp4) : _temp4(_temp3));
      } catch (e) {
        return Promise.reject(e);
      }
    }

    deleteAll({
      ids
    }) {
      const batch = this.Admin.firestore.batch();

      for (const id of ids) {
        const ref = this.doc(id);
        batch.delete(ref);
      }

      return batch.commit();
    }

    add({
      data
    }) {
      try {
        const _this8 = this;

        data = lodash.omit(data, 'id');

        _this8._addTimestamps(data);

        return Promise.resolve(_this8.collection.add(data)).then(function (ref) {
          data.id = ref.id;
          return data;
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
        const _this9 = this;

        return Promise.resolve(_this9.get({
          id
        })).then(function (user) {
          const _temp5 = function () {
            if (!user) {
              return Promise.resolve(add(data)).then(function (_add) {
                data = _add;
                return Promise.resolve(_this9.set({
                  id,
                  data,
                  merge: false
                })).then(function (_this9$set) {
                  user = _this9$set;
                });
              });
            }
          }();

          return _temp5 && _temp5.then ? _temp5.then(function () {
            return user;
          }) : user;
        });
      } catch (e) {
        return Promise.reject(e);
      }
    }

    findOneByField(field) {
      return value => {
        return this.findOne({
          query: [field, '==', value]
        });
      };
    }

    set({
      id,
      data,
      merge = true,
      assert = false,
      get = true
    }) {
      try {
        const _this10 = this;

        function _temp7() {
          data = lodash.omit(data, 'id');

          _this10._addUpdatedAt(data);

          const ref = _this10.doc(id);

          return Promise.resolve(ref.set(data, {
            merge
          })).then(function (set) {
            return get ? _this10.get({
              id
            }) : set;
          });
        }

        const _temp6 = function () {
          if (assert) {
            return Promise.resolve(_this10.existsAssert({
              id
            })).then(function () {});
          }
        }();

        return Promise.resolve(_temp6 && _temp6.then ? _temp6.then(_temp7) : _temp7(_temp6));
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
        const _this11 = this;

        const value = data[field];
        return Promise.resolve(_this11.findOneByField(field)(value)).then(function (doc) {
          if (doc) {
            const {
              id
            } = doc;
            return _this11.set({
              id,
              data
            });
          } else {
            return Promise.resolve(add(data)).then(function (_add2) {
              data = _add2;
              return _this11.add({
                data
              });
            });
          }
        });
      } catch (e) {
        return Promise.reject(e);
      }
    }

    _timestamp() {
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

  function instanceGetter({
    Constructors,
    options
  }) {
    return function getter(name) {
      if (!(name in Constructors)) {
        const msg = `Constructor with name ${name} does not exist`;
        throw new Error(msg);
      }

      const Constructor = Constructors[name];
      return Constructor.instance(options);
    };
  }

  function processOptions(input) {
    logger.debug('Processing options', {
      name: 'processOptions',
      input
    });

    const {
      Services,
      Collections
    } = input,
          options = _objectWithoutPropertiesLoose(input, ["Services", "Collections"]);

    options.getService = instanceGetter({
      Constructors: Services,
      options
    });
    options.getCollection = instanceGetter({
      Constructors: Collections,
      options
    });
    return options;
  }

  function getToken(request) {
    if (!request) {
      return null;
    }

    const header = request.get('Authorization');
    const prefix = /^Bearer /;

    if (header && header.match(prefix)) {
      return header.replace(prefix, '');
    } else {
      return null;
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

  function contextBuilder(_ref) {
    let {
      loadSession,
      getToken: getToken$1 = getToken,
      start = () => {}
    } = _ref,
        input_options = _objectWithoutPropertiesLoose(_ref, ["loadSession", "getToken", "start"]);

    return function ({
      req: request
    } = {}) {
      try {
        const logger$1 = logger.child('contextBuilder');
        return Promise.resolve(start()).then(function () {
          function _temp3() {
            return _extends({
              session_id,
              user_id,
              user,
              load_user_error,
              getLoader
            }, options);
          }

          const options = processOptions(input_options);
          const {
            getCollection
          } = options;

          function getLoader(arg) {
            const name = arg.name || arg;

            if (!(name in loaders)) {
              const collection = getCollection(name);
              loaders[name] = collection.loader;
            }

            return loaders[name];
          }

          const loaders = {};
          let session_id = null;
          let user_id = null;
          let user = null;
          let load_user_error = null;
          logger$1.debug('Getting token');
          const token = getToken$1(request);

          const _temp2 = function () {
            if (token) {
              const _temp = _catch(function () {
                logger$1.debug('Loading session');
                return Promise.resolve(loadSession({
                  token,
                  getCollection
                })).then(function (_loadSession) {
                  ({
                    session_id,
                    user_id,
                    user
                  } = _loadSession);
                  logger$1.debug('Loaded session', {
                    session_id,
                    user
                  });
                });
              }, function (error) {
                logger$1.error('Error loading session', error);
                load_user_error = error;
              });

              if (_temp && _temp.then) return _temp.then(function () {});
            }
          }();

          return _temp2 && _temp2.then ? _temp2.then(_temp3) : _temp3(_temp2);
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };
  }

  function formatError(error) {
    logger.error(error);
    let data = GraphQL.formatError(error);
    const {
      originalError: oerror
    } = error;

    if (oerror && oerror.expected) {
      data.code = oerror.code;
    } else {
      const public_error = new GraphQLError();
      data = GraphQL.formatError(public_error);
      data.code = public_error.code;
    }

    return data;
  }

  function exposeResolvers({
    Controllers,
    Scalars,
    options
  }) {
    const logger$1 = logger.child('exposeResolvers');
    const resolvers = {};

    for (const [name, Controller] of Object.entries(Controllers)) {
      logger$1.debug(`Exposing controller ${name}`);
      const controller = new Controller(options);
      lodash.merge(resolvers, controller.expose());
    }

    lodash.merge(resolvers, Scalars);
    return resolvers;
  }

  function makeSchema({
    Schema,
    Controllers,
    Scalars,
    options
  }) {
    const resolvers = exposeResolvers({
      Controllers,
      Scalars,
      options
    });
    return graphqlTools.makeExecutableSchema({
      typeDefs: Schema,
      resolvers
    });
  }

  function createGraphqlHandler({
    Controllers,
    Scalars,
    Schema,
    options = {}
  }) {
    const logger$1 = logger.child({
      name: 'createGraphqlHandler',
      options
    });
    logger$1.debug('Creating GraphQL handler');
    const {
      server: opts_server = {},
      handler: opts_handler = {},
      controller: opts_controller = {}
    } = options;

    if (!opts_server.formatError) {
      opts_server.formatError = formatError;
    }

    const processed_options = processOptions(opts_controller);
    logger$1.debug('Making schema');
    const schema = makeSchema({
      options: processed_options,
      Schema,
      Controllers,
      Scalars
    });
    logger$1.debug('Creating server', {
      options: opts_server
    });
    const server = new apolloServerCloudFunctions.ApolloServer(_extends({}, opts_server, {
      schema
    }));
    logger$1.debug('Creating handler', {
      options: opts_handler
    });
    return server.createHandler(opts_handler);
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

  function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
  }

  const APOLLO_UNION_RESOLVER_NAME = '__resolveType';
  class GraphQLController {
    constructor(options) {
      this.exists = this._toCollection('exists');
      this.get = this._toCollection('get');
      this.list = this._toCollection('list');
      this.create = this._wrapToCollection('create');
      this.update = this._wrapToCollection('update');

      if (options) {
        initialize.call(this, _extends({
          namespace: 'GraphQLController'
        }, options));
      }
    }

    get name() {
      throw new Error('Child class must implement .name');
    }

    resolvers() {
      throw new Error('Child class must implement .resolvers');
    }

    collection(name) {
      return this.getCollection(name || this.name);
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
            if (!lodash.isFunction(definition[field])) {
              throw new Error(`Invalid ${field} definition for ${path}`);
            }
          }

          const {
            resolver,
            authorizer
          } = definition;

          result[type][name] = function (obj, args, context, info) {
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
              const rlogger = logger.child({
                resolver: name,
                type,
                user,
                obj,
                args
              });
              rlogger.debug(`Calling resolver ${path}`);
              return Promise.resolve(_catch$1(function () {
                const {
                  load_user_error
                } = context;

                if (load_user_error) {
                  throw load_user_error;
                }

                return Promise.resolve(authorizer.call(_this, params)).then(function (authorized) {
                  if (!authorized) {
                    const error = new NotAuthorizedError({
                      path
                    });
                    rlogger.error(error);
                    throw error;
                  }

                  return Promise.resolve(resolver.call(_this, params)).then(function (result) {
                    rlogger.info('Resolver result', {
                      result
                    });
                    return result;
                  });
                });
              }, function (error) {
                if (error.expected) {
                  rlogger.error('Expected GraphQL error', error);
                  throw error;
                } else {
                  rlogger.error(error);
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

    delete(request) {
      try {
        const _this2 = this;

        function _temp4() {
          const {
            id
          } = request.args;

          const collection = _this2.collection();

          return Promise.resolve(collection.delete({
            id
          })).then(function (deleted) {
            function _temp2() {
              return {
                deleted_at,
                deleted
              };
            }

            const deleted_at = new Date();

            const _temp = function () {
              if (_this2.afterDelete) {
                return Promise.resolve(_this2.afterDelete(_extends({}, request, {
                  deleted,
                  deleted_at
                }))).then(function () {});
              }
            }();

            return _temp && _temp.then ? _temp.then(_temp2) : _temp2(_temp);
          });
        }

        const _temp3 = function () {
          if (_this2.beforeDelete) {
            return Promise.resolve(_this2.beforeDelete(request)).then(function () {});
          }
        }();

        return Promise.resolve(_temp3 && _temp3.then ? _temp3.then(_temp4) : _temp4(_temp3));
      } catch (e) {
        return Promise.reject(e);
      }
    }

    _toCollection(method) {
      return request => {
        const collection = this.collection();
        return collection[method](request.args);
      };
    }

    _wrapToCollection(method) {
      const _this3 = this;

      const cmethod = capitalize(method);
      const before = `before${cmethod}`;
      const after = `after${cmethod}`;
      return function (request) {
        try {
          function _temp7() {
            return Promise.resolve(collection[method]({
              data
            })).then(function (doc) {
              const _temp5 = function () {
                if (_this3[after]) {
                  return Promise.resolve(_this3[after](_extends({}, request, {
                    data,
                    doc
                  }))).then(function (_this3$after) {
                    doc = _this3$after;
                  });
                }
              }();

              return _temp5 && _temp5.then ? _temp5.then(function () {
                return doc;
              }) : doc;
            });
          }

          const collection = _this3.collection();

          let {
            data
          } = request.args;

          const _temp6 = function () {
            if (_this3[before]) {
              return Promise.resolve(_this3[before](request)).then(function (_this3$before) {
                data = _this3$before;
              });
            }
          }();

          return Promise.resolve(_temp6 && _temp6.then ? _temp6.then(_temp7) : _temp7(_temp6));
        } catch (e) {
          return Promise.reject(e);
        }
      };
    }

  }

  function processDefinitions(definitions) {
    const enums = {};
    const groups = {
      Query: [],
      Mutation: [],
      Type: []
    };

    for (const definition of definitions) {
      const {
        kind
      } = definition;
      const name = lodash.get(definition, 'name.value');

      if (!name) {
        continue;
      }

      switch (kind) {
        case 'ScalarTypeDefinition':
        case 'InterfaceTypeDefinition':
        case 'UnionTypeDefinition':
          groups.Type.push(name);
          break;

        case 'EnumTypeDefinition':
          {
            const {
              values
            } = definition;
            enums[name] = values.reduce((result, value_definition) => {
              const {
                value
              } = value_definition.name;
              result[value] = value;
              return result;
            }, {});
            break;
          }

        case 'ObjectTypeDefinition':
          {
            const is_query_or_mutation = ['Query', 'Mutation'].includes(name);

            if (is_query_or_mutation) {
              const {
                fields
              } = definition;

              for (const field of fields) {
                const {
                  value
                } = field.name;
                groups[name].push(value);
              }
            } else {
              groups.Type.push(name);
            }

            break;
          }
      }
    }

    return {
      enums,
      groups
    };
  }

  function checkSchema({
    groups: schema_groups,
    resolvers
  }) {
    const resolver_groups = Object.entries(resolvers).reduce((names, [k, v]) => {
      if (k in names) {
        names[k] = Object.keys(v);
      } else {
        names.Type.push(k);
      }

      return names;
    }, {
      Type: [],
      Query: null,
      Mutation: null
    });
    return Object.entries(schema_groups).reduce((errors, [kind, schema_names]) => {
      const resolver_names = resolver_groups[kind];
      const differences = {
        resolver: lodash.difference(schema_names, resolver_names),
        schema: lodash.difference(resolver_names, schema_names)
      };
      return Object.entries(differences).reduce((errors, [source, diff]) => {
        const new_errors = diff.map(name => `Missing ${source} for ${name}`);
        return [...errors, ...new_errors];
      }, errors);
    }, []);
  }

  function processSchema({
    Schema,
    Controllers,
    Scalars
  }) {
    const resolvers = exposeResolvers({
      Controllers,
      Scalars
    });
    const {
      definitions
    } = Schema;
    const {
      enums,
      groups
    } = processDefinitions(definitions);
    const errors = checkSchema({
      resolvers,
      groups
    });
    return {
      enums,
      groups,
      errors
    };
  }

  function createHttpHandler({
    Handler,
    options
  }) {
    const app = Express();
    const cors = Cors(options.cors);
    app.use(cors);
    options = processOptions(options.handler);
    logger.debug('Creating HTTP Handler', {
      name: 'createHttpHandler',
      options,
      Handler
    });
    const handler = new Handler(options);
    handler.expose(app);
    return app;
  }

  class Handler {
    constructor(_ref) {
      let {
        start
      } = _ref,
          options = _objectWithoutPropertiesLoose(_ref, ["start"]);

      this.start = start;
      initialize.call(this, _extends({
        namespace: 'Handler'
      }, options));
    }

    get name() {
      throw new Error('Child class must implement .name');
    }

    actions() {
      throw new Error('Handler should implement actions');
    }

    expose() {
      throw new Error('Handler should implement expose');
    }

  }

  function _catch$2(body, recover) {
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

  class HttpHandler extends Handler {
    expose(app) {
      let actions = this.actions();

      if (!Array.isArray(actions)) {
        actions = Object.entries(actions).map(([route, action]) => {
          if (!route.includes(' ')) {
            route = `GET ${route}`;
          }

          const [method, path] = route.split(/\s+/);
          return {
            method,
            path,
            action
          };
        });
      }

      for (const {
        method,
        path,
        action
      } of actions) {
        const fn = method.toLowerCase();
        app[fn](path, this.handle(action));
      }

      return app;
    }

    handle(action) {
      const _this = this;

      return function (request, response) {
        try {
          return Promise.resolve(_this.start()).then(function () {
            const {
              params
            } = request;

            const logger = _this.logger.child({
              action,
              params
            });

            return _catch$2(function () {
              logger.info('Calling handler');

              const method = _this[action].bind(_this);

              return Promise.resolve(method({
                params,
                request,
                response
              })).then(function (data) {
                logger.info('Handler success', {
                  data
                });
                return response.json(data);
              });
            }, function (error) {
              logger.error('Handler failure', error);
              return response.status(error.status || 500).json({
                error: error.message
              });
            });
          });
        } catch (e) {
          return Promise.reject(e);
        }
      };
    }

  }

  function createPubSubHandler({
    Handler,
    options
  }) {
    options = processOptions(options.handler);
    logger.debug('Creating PubSub Handler', {
      name: 'createPubSubHandler',
      options,
      Handler
    });
    const handler = new Handler(options);
    return handler.expose();
  }

  function _catch$3(body, recover) {
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

  class PubSubHandler extends Handler {
    expose(topic) {
      let actions = this.actions(topic);

      if (!Array.isArray(actions)) {
        actions = Object.entries(actions).map(([topic, action]) => {
          return {
            topic,
            action
          };
        });
      }

      return actions.map(({
        topic,
        action
      }) => {
        const handler = this.handle(action);
        return {
          topic,
          handler
        };
      });
    }

    handle(action) {
      const _this = this;

      return function (message, context) {
        try {
          return Promise.resolve(_this.start()).then(function () {
            const {
              json,
              data,
              attributes
            } = message;

            const logger = _this.logger.child({
              name: 'handle',
              json,
              attributes,
              context
            });

            const _temp = _catch$3(function () {
              logger.info('Running handler');
              const args = {
                json,
                data,
                attributes,
                context
              };
              return Promise.resolve(action.call(_this, args)).then(function (response) {
                logger.info('Handler success', response);
              });
            }, function (error) {
              logger.error('Handler failure', error);
            });

            if (_temp && _temp.then) return _temp.then(function () {});
          });
        } catch (e) {
          return Promise.reject(e);
        }
      };
    }

  }

  const directGraphqlRequest = function ({
    Schema,
    context,
    query,
    variables
  }) {
    try {
      const rlogger = logger.child({
        name: 'localGraphqlRequest',
        query,
        variables
      });
      rlogger.debug('Making request');
      const root = {};
      return Promise.resolve(GraphQL.graphql(Schema, query, root, context, variables)).then(function (response) {
        const {
          data,
          errors
        } = response;

        if (errors) {
          const error = errors[0];
          rlogger.error(error);
          throw error;
        } else {
          rlogger.debug('Got response', {
            data
          });
          return data;
        }
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };

  exports.Authorizers = Authorizers;
  exports.Collection = Collection;
  exports.DoesNotExistError = DoesNotExistError;
  exports.Errors = Errors;
  exports.FirestoreCollection = FirestoreCollection;
  exports.GraphQLController = GraphQLController;
  exports.GraphQLError = GraphQLError;
  exports.HttpHandler = HttpHandler;
  exports.NotAuthorizedError = NotAuthorizedError;
  exports.PubSubHandler = PubSubHandler;
  exports.contextBuilder = contextBuilder;
  exports.createGraphqlHandler = createGraphqlHandler;
  exports.createHttpHandler = createHttpHandler;
  exports.createPubSubHandler = createPubSubHandler;
  exports.directGraphqlRequest = directGraphqlRequest;
  exports.processSchema = processSchema;

})));
//# sourceMappingURL=index.umd.js.map
