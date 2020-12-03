import { ApolloError, ApolloServer } from 'apollo-server-cloud-functions';
import DataLoader from 'dataloader';
import { compact, uniq, isObject, isNumber, omit, merge, isFunction, get, difference } from 'lodash';
import { mapp, singleton } from '@hello10/util';
import Logger from '@hello10/logger';
import { formatError as formatError$1, graphql } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';
import Express from 'express';
import Cors from 'cors';

class GraphQLError extends ApolloError {
  constructor({
    code = 'GraphQLError',
    message = 'Server error',
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
  const required = ['Admin', 'Enums', 'getCollection', 'getService'];

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
  } // Leaf child classes MUST overide name getter that the name of the
  // collection backing this collection
  // ================================================================


  get name() {
    throw new Error('Collection child class must implement .name');
  } // Implementation child classes MUST overide collection getter that
  // returns a collection instance from the backing database
  // ================================================================


  get collection() {
    throw new Error('Collection child class must implement .collection');
  } // Implementation child classes MUST override unimplemented methods
  // ================================================================
  // create    ({data})
  // exists    ({id, assert = false})
  // get       ({id, assert = false})
  // getAll    ({ids, assert = false})
  // find      ({query, limit, sort, at, after, select} = {})
  // update    ({id, data, merge = true, assert = false})
  // delete    ({id, assert = true})
  // deleteAll ({ids})
  //
  // Child classes MAY override implemented CRUD methods
  // ================================================================
  // createAll       ({datas})
  // findOrCreate    ({query, data})
  // existsAssert    ({id})
  // existsAll       ({ids, assert = false})
  // existsAllAssert ({ids})
  // getAssert       ({id})
  // getAllAssert    ({ids})
  // findOne         ({query, sort, select})
  // findIds         ({query})
  // list            ({limit, sort, at, after} = {})
  // updateAssert    ({id, data, merge = true})
  // updateAll       ({ids, data, merge = true, assert = false})
  // updateAllAssert ({ids, data, merge = true})
  // updateMany      ({query, data, merge = true})
  // deleteAssert    ({id})
  // deleteMany      ({query})
  /////////////////
  // Core:Create //
  /////////////////


  create()
  /* {data} */
  {
    throw new Error('Collection child class must implement .create');
  }

  createAll({
    datas
  }) {
    return mapp(datas, data => this.create({
      data
    }));
  }

  async findOrCreate({
    query,
    data
  }) {
    const doc = await this.findOne({
      query
    });
    return doc || this.create({
      data
    });
  } ///////////////
  // Core:Read //
  ///////////////


  exists()
  /* {id, assert = false} */
  {
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

  async existsAll({
    ids,
    assert = false
  }) {
    const docs = await this.getAll({
      ids,
      assert
    });
    return docs.every(doc => !!doc);
  }

  existsAllAssert({
    ids
  }) {
    return this.existsAll({
      ids,
      assert: true
    });
  }

  get()
  /* {id, assert = false} */
  {
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

  getAll()
  /* {ids, assert = false} */
  {
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

  find()
  /* {query, limit, sort, at, after, select} = {} */
  {
    throw new Error('Collection child class must implement .find');
  }

  async findOne({
    query,
    sort,
    select
  }) {
    const docs = await this.find({
      limit: 1,
      query,
      sort,
      select
    });
    return docs.length > 0 ? docs[0] : null;
  }

  async findIds({
    query
  }) {
    const docs = await this.find({
      query,
      select: ['id']
    });
    return docs.map(({
      id
    }) => id);
  }

  async list({
    limit,
    sort,
    at,
    after
  } = {}) {
    return this.find({
      limit,
      sort,
      at,
      after
    });
  } /////////////////
  // Core:Update //
  /////////////////


  update()
  /* {id, data, merge = true, assert = false} */
  {
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

  async updateAll({
    ids,
    data,
    merge = true,
    assert = false
  }) {
    this._addUpdatedAt(data);

    return mapp(ids, id => {
      return this.update({
        id,
        data,
        merge,
        assert
      });
    });
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

  async updateMany({
    query,
    data,
    merge = true
  }) {
    const ids = await this.findIds({
      query
    });
    return this.updateAll({
      ids,
      data,
      merge
    });
  } /////////////////
  // Core:Delete //
  /////////////////


  delete()
  /* {id, assert = true} */
  {
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

  deleteAll()
  /* {ids} */
  {
    throw new Error('Collection child class must implement .deleteAll');
  }

  async deleteMany({
    query
  }) {
    const ids = await this.findIds({
      query
    });
    return this.deleteAll({
      ids
    });
  } /////////////
  // Loaders //
  /////////////


  get loader() {
    const loader = new DataLoader(async ids => {
      this.logger.debug({
        message: `calling DataLoader for ${this.name}`,
        ids
      });
      const docs = await this.getAll({
        ids
      });
      const lookup = new Map();

      for (const doc of docs) {
        lookup.set(doc.id.toString(), doc);
      }

      return ids.map(id => {
        const id_s = id.toString();
        return lookup.has(id_s) ? lookup.get(id_s) : null;
      });
    });

    loader.loadManyCompact = async function loadManyCompact(ids) {
      const docs = await loader.loadMany(ids);
      return compact(docs);
    };

    return loader;
  } /////////////
  // Helpers //
  /////////////


  timestamp() {
    return new Date();
  }

  _addTimestamps(obj, time) {
    if (!time) {
      time = this.timestamp();
    }

    this._addCreatedAt(obj, time);

    this._addUpdatedAt(obj, time);

    return obj;
  }

  _addCreatedAt(obj, time) {
    if (!('created_at' in obj)) {
      obj.created_at = time || this.timestamp();
    }

    return obj;
  }

  _addUpdatedAt(obj, time) {
    if (!('updated_at' in obj)) {
      obj.updated_at = time || this.timestamp();
    }

    return obj;
  }

}
singleton(Collection);

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

  get firestore() {
    return this.app.firestore();
  }

  get collection() {
    return this.firestore.collection(this.name);
  }

  doc(id) {
    return this.collection.doc(id);
  } /////////////////
  // Core:Create //
  /////////////////


  async create({
    data
  }) {
    const {
      id
    } = await this.add({
      data
    });
    return this.get({
      id
    });
  } ///////////////
  // Core:Read //
  ///////////////


  async exists({
    id,
    assert = false
  }) {
    const ref = this.doc(id);
    const snap = await ref.get();
    const {
      exists
    } = snap;

    if (assert && !exists) {
      const type = this.name();
      throw new DoesNotExistError({
        type,
        id
      });
    }

    return exists;
  }

  async get({
    id,
    assert = false
  }) {
    const ref = this.doc(id);
    const snap = await ref.get();

    if (assert && !snap.exists) {
      const type = this.name();
      throw new DoesNotExistError({
        type,
        id
      });
    }

    return this._snapToDoc(snap);
  }

  async getAll({
    ids,
    assert = false
  }) {
    if (!ids || ids.length === 0) {
      return [];
    }

    const uniques = uniq(ids);
    const refs = uniques.map(id => this.doc(id));
    const snaps = await this.firestore.getAll(...refs);
    const docs = snaps.map(snap => this._snapToDoc(snap));
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
        type: this.name,
        ids: missing_ids
      });
    } else {
      return result;
    }
  }

  async find({
    query,
    limit,
    sort,
    at,
    after,
    select
  } = {}) {
    let cursor = this.collection;

    function invalid(field) {
      throw new Error(`Invalid ${field} for find`);
    }

    if (query) {
      let parts;

      if (Array.isArray(query)) {
        parts = Array.isArray(query[0]) ? query : [query];
      } else if (isObject(query)) {
        parts = Object.entries(query).map(([field, value]) => {
          return [field, '==', value];
        });
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

    const start = after || at;

    if (start) {
      const doc = await this.doc(start).get();
      const fn = after ? 'startAfter' : 'startAt';
      cursor = cursor[fn](doc);
    }

    if (limit) {
      if (!isNumber(limit)) {
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

    const snap = await cursor.get();
    return snap.docs.map(this._snapToDoc);
  } /////////////////
  // Core:Update //
  /////////////////


  async update(args) {
    return this.set(args);
  } /////////////////
  // Core:Delete //
  /////////////////


  async delete({
    id,
    assert = true
  }) {
    const doc = await this.get({
      id,
      assert
    });

    if (doc) {
      const ref = this.doc(id);
      await ref.delete();
    }

    return doc;
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
  } ///////////////
  // Auxiliary //
  ///////////////


  async add({
    data
  }) {
    data = omit(data, 'id');

    this._addTimestamps(data);

    const ref = await this.collection.add(data);
    data.id = ref.id;
    return data;
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

  findOneByField(field) {
    return value => {
      return this.findOne({
        query: [field, '==', value]
      });
    };
  }

  async set({
    id,
    data,
    merge = true,
    assert = false,
    get = true
  }) {
    if (assert) {
      await this.existsAssert({
        id
      });
    }

    data = omit(data, 'id');

    this._addUpdatedAt(data);

    const ref = this.doc(id);
    const set = await ref.set(data, {
      merge
    });
    return get ? this.get({
      id
    }) : set;
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
  } /////////////
  // Helpers //
  /////////////


  timestamp() {
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

function addInstanceGetters(input) {
  logger.debug('Processing options', {
    name: 'addInstanceGetters',
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

function contextBuilder(_ref) {
  let {
    loadSession,
    getToken: getToken$1 = getToken,
    start = () => {}
  } = _ref,
      input_options = _objectWithoutPropertiesLoose(_ref, ["loadSession", "getToken", "start"]);

  return async ({
    req: request
  } = {}) => {
    // TODO: support serializers in logger
    const logger$1 = logger.child('contextBuilder');
    await start();
    const options = addInstanceGetters(input_options);
    const {
      getCollection
    } = options;
    const loaders = {};

    function getLoader(arg) {
      const name = arg.name || arg;

      if (!(name in loaders)) {
        const collection = getCollection(name);
        loaders[name] = collection.loader;
      }

      return loaders[name];
    }

    let session_id = null;
    let user_id = null;
    let user = null;
    let load_user_error = null;

    try {
      logger$1.debug('Getting token');
      const token = getToken$1(request);
      logger$1.debug('Loading session');
      const session = await loadSession({
        token,
        getCollection,
        getLoader
      });
      ({
        session_id,
        user_id,
        user
      } = session);
      logger$1.debug('Loaded session', {
        session_id,
        user
      });
    } catch (error) {
      logger$1.error('Error loading session', error);
      load_user_error = error;
    }

    return _extends({
      session_id,
      user_id,
      user,
      load_user_error,
      getLoader
    }, options);
  };
}

function formatError(error) {
  logger.error(error);
  let data = formatError$1(error);
  const {
    originalError: oerror
  } = error;

  if (oerror && oerror.expected) {
    data.code = oerror.code;
  } else {
    // Handle context creation errors don't include original
    // const missing = error.message.match(/Missing session user ([^\s]{24})/);
    // let public_error;
    // if (missing) {
    //   const id = missing[1];
    //   public_error = new Errors.SessionUserMissing({id});
    // } else {
    //   public_error = new Errors.Public();
    // }
    const public_error = new GraphQLError();
    data = formatError$1(public_error);
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
    merge(resolvers, controller.expose());
  }

  merge(resolvers, Scalars);
  return resolvers;
}

function makeSchema({
  Schema,
  Controllers,
  Scalars,
  options = {}
}) {
  logger.debug('Making schema', {
    name: 'makeSchema',
    options
  });
  options = addInstanceGetters(options);
  const resolvers = exposeResolvers({
    Controllers,
    Scalars,
    options
  });
  return makeExecutableSchema({
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
  const {
    server: opts_server = {},
    handler: opts_handler = {},
    controller: opts_controller = {}
  } = options;
  const schema = makeSchema({
    options: opts_controller,
    Schema,
    Controllers,
    Scalars
  });
  logger$1.debug('Creating ApolloServer', {
    options: opts_server
  });

  if (!opts_server.formatError) {
    opts_server.formatError = formatError;
  }

  const server = new ApolloServer(_extends({}, opts_server, {
    schema
  }));
  logger$1.debug('Creating GraphQL handler', {
    options: opts_handler
  });
  return server.createHandler(opts_handler);
}

// graphql(
//   schema: GraphQLSchema,
//   requestString: string,
//   rootValue?: ?any,
//   contextValue?: ?any,
//   variableValues?: ?{[key: string]: any},
//   operationName?: ?string
// ): Promise<GraphQLResult>

async function directGraphqlRequest({
  schema,
  context,
  query,
  variables
}) {
  const rlogger = logger.child({
    name: 'localGraphqlRequest',
    query,
    variables
  });
  rlogger.debug('Making request');
  const root = {};
  const response = await graphql(schema, query, root, context, variables);
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
}

function directGraphqlRequester({
  Schema,
  Controllers,
  Scalars,
  options,
  buildContext
}) {
  const schema = makeSchema({
    Schema,
    Controllers,
    Scalars,
    options
  });
  return async function request({
    query,
    variables
  }) {
    const context = await buildContext();
    return directGraphqlRequest({
      schema,
      context,
      query,
      variables
    });
  };
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

const APOLLO_UNION_RESOLVER_NAME = '__resolveType';
class GraphQLController {
  constructor(options) {
    this.exists = this._toCollection('exists');
    this.list = this._toCollection('list');
    this.create = this._wrapToCollection('create');
    this.update = this._wrapToCollection('update');
    this.delete = this._wrapToCollection('delete');
    this.get = this.load({
      collection: this.name,
      path: 'args.id'
    });

    // Only initialize if options are passed (we skip when building schema)
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

  get collection() {
    return this.getCollection(this.name);
  }

  expose() {
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
        const path = `${type}.${name}`; // Resolve Union types
        // https://www.apollographql.com/docs/graphql-tools/resolvers/#unions-and-interfaces

        if (name === APOLLO_UNION_RESOLVER_NAME) {
          result[type][name] = (obj, context, info) => {
            return definition.call(this, {
              obj,
              context,
              info
            });
          };

          continue;
        } // This seems like a dumb idea unless there's some dynmamic thing that
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

        const {
          resolver,
          authorizer
        } = definition;

        result[type][name] = async (obj, args, context, info) => {
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

          try {
            // Have to handle this explicitly, would be better to have
            // this in context build derp meh
            const {
              load_user_error
            } = context;

            if (load_user_error) {
              throw load_user_error;
            }

            const authorized = await authorizer.call(this, params);

            if (!authorized) {
              const error = new NotAuthorizedError({
                path
              });
              rlogger.error(error);
              throw error;
            }

            const result = await resolver.call(this, params);
            rlogger.info('Resolver result', {
              result
            });
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

  load({
    collection,
    path
  }) {
    return request => {
      const loader = request.context.getLoader(collection);
      const id = get(request, path);
      return id ? loader.load(id) : null;
    };
  }

  loadMany({
    collection,
    path
  }) {
    return request => {
      const loader = request.context.getLoader(collection);
      const ids = get(request, path);
      return ids.length ? loader.loadMany(ids) : [];
    };
  }

  resolveType(getType) {
    return request => {
      const type = getType(request);
      return request.info.schema.getType(type);
    };
  }

  stub() {
    throw new Error('Unimplemented stub');
  }

  addSessionUserId(key) {
    return ({
      data,
      context
    }) => {
      return _extends({}, data, {
        [key]: context.user.id
      });
    };
  }

  pass({
    obj,
    info
  }) {
    const attr = info.fieldName;
    return obj[attr];
  }

  polyRef({
    obj,
    info,
    context
  }) {
    const {
      fieldName: name
    } = info;
    const type = obj[`${name}_type`];
    const id = obj[`${name}_id`];

    if (!(type && id)) {
      return null;
    }

    const Loader = context.getLoader(type);
    return Loader.load(id);
  } ///////////////////////
  // Generic Resolvers //
  ///////////////////////


  _toCollection(method) {
    return request => {
      return this.collection[method](request.args);
    };
  }

  _wrapToCollection(method) {
    const cmethod = capitalize(method);
    const before = `before${cmethod}`;
    const after = `after${cmethod}`;
    return async request => {
      const {
        args = {}
      } = request;
      let {
        data
      } = args;

      if (this[before]) {
        data = await this[before](_extends({}, request, {
          data
        }));
      }

      let doc = await this.collection[method](_extends({}, args, {
        data
      }));

      if (this[after]) {
        const result = await this[after](_extends({}, request, {
          data,
          doc
        }));

        if (result !== undefined) {
          doc = result;
        }
      }

      return doc;
    };
  }

}

// can be written to the shared package so we can use those instead of
// magic strings in the applications

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
    const name = get(definition, 'name.value');

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
} // TODO: handle checking resolved type fields as well by using @ref directive


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
      resolver: difference(schema_names, resolver_names),
      schema: difference(resolver_names, schema_names)
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
  options = addInstanceGetters(options.handler);
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
    return async (request, response) => {
      await this.start();
      const {
        params
      } = request;
      const logger = this.logger.child({
        action,
        params
      });

      try {
        logger.info('Calling handler');
        const method = this[action].bind(this);
        const data = await method({
          params,
          request,
          response
        });
        logger.info('Handler success', {
          data
        });
        return response.json(data);
      } catch (error) {
        logger.error('Handler failure', error);
        return response.status(error.status || 500).json({
          error: error.message
        });
      }
    };
  }

}

function createPubSubHandler({
  Handler,
  options
}) {
  options = addInstanceGetters(options.handler);
  logger.debug('Creating PubSub Handler', {
    name: 'createPubSubHandler',
    options,
    Handler
  });
  const handler = new Handler(options);
  return handler.expose();
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
    return async (message, context) => {
      console.log('calling pubsub start...');
      await this.start();
      const {
        json,
        data,
        attributes
      } = message;
      const logger = this.logger.child({
        name: 'handle',
        json,
        attributes,
        context
      });

      try {
        logger.info('Running handler');
        const args = {
          json,
          data,
          attributes,
          context
        };
        const response = await action.call(this, args);
        logger.info('Handler success', response);
      } catch (error) {
        logger.error('Handler failure', error);
      }
    };
  }

}

export { Authorizers, Collection, DoesNotExistError, Errors, FirestoreCollection, GraphQLController, GraphQLError, Handler, HttpHandler, NotAuthorizedError, PubSubHandler, addInstanceGetters, contextBuilder, createGraphqlHandler, createHttpHandler, createPubSubHandler, directGraphqlRequest, directGraphqlRequester, makeSchema, processSchema };
//# sourceMappingURL=index.esm.js.map
