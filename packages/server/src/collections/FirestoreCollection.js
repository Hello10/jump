import {omit, uniq, isNumber, isObject} from 'lodash';

import Collection from './Collection';
import timestampsToDates from './timestampsToDates';
import {DoesNotExistError} from '../Errors';

export default class FirestoreCollection extends Collection {
  constructor (options) {
    super(options);
    const {Admin, app} = options;
    this.Admin = Admin;
    this.app = app;
  }

  get auth () {
    return this.app.auth();
  }

  get firestore () {
    return this.app.firestore();
  }

  get collection () {
    return this.firestore.collection(this.name);
  }

  doc (id) {
    return this.collection.doc(id);
  }

  /////////////////
  // Core:Create //
  /////////////////

  async create ({data}) {
    const {id} = await this.add({data});
    return this.get({id});
  }

  ///////////////
  // Core:Read //
  ///////////////

  async exists ({id, assert = false}) {
    const ref = this.doc(id);
    const snap = await ref.get();
    const {exists} = snap;
    if (assert && !exists) {
      const type = this.name();
      throw new DoesNotExistError({type, id});
    }
    return exists;
  }

  async get ({id, assert = false}) {
    const ref = this.doc(id);
    const snap = await ref.get();
    if (assert && !snap.exists) {
      const type = this.name();
      throw new DoesNotExistError({type, id});
    }
    return this._snapToDoc(snap);
  }

  async getAll ({ids, assert = false}) {
    if (!ids || ids.length === 0) {
      return [];
    }

    const uniques = uniq(ids);
    const refs = uniques.map((id)=> this.doc(id));
    const snaps = await this.firestore.getAll(...refs);
    const docs = snaps.map((snap)=> this._snapToDoc(snap));

    const docs_by_id = {};
    for (const doc of docs) {
      if (doc) {
        docs_by_id[doc.id] = doc;
      }
    }

    const missing_ids = [];
    const result = ids.map((id)=> {
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

  async find ({query, limit, sort, at, after, select} = {}) {
    let cursor = this.collection;

    function invalid (field) {
      throw new Error(`Invalid ${field} for find`);
    }

    if (query) {
      let parts;
      if (Array.isArray(query)) {
        parts = Array.isArray(query[0]) ? query : [query];
      } else if (isObject(query)) {
        parts = Object.entries(query).map(([field, value])=> {
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
  }

  /////////////////
  // Core:Update //
  /////////////////

  async update (args) {
    return this.set(args);
  }

  /////////////////
  // Core:Delete //
  /////////////////

  async delete ({id, assert = true}) {
    const doc = await this.get({id, assert});
    if (doc) {
      const ref = this.doc(id);
      await ref.delete();
    }
    return doc;
  }

  deleteAll ({ids}) {
    const batch = this.Admin.firestore.batch();
    for (const id of ids) {
      const ref = this.doc(id);
      batch.delete(ref);
    }
    return batch.commit();
  }

  ///////////////
  // Auxiliary //
  ///////////////

  async add ({data}) {
    data = omit(data, 'id');
    this._addTimestamps(data);
    const ref = await this.collection.add(data);
    data.id = ref.id;
    return data;
  }

  async getOrAddById ({id, data, add = (x)=> x}) {
    let user = await this.get({id});
    if (!user) {
      data = await add(data);
      user = await this.set({id, data, merge: false});
    }
    return user;
  }

  findOneByField (field) {
    return (value)=> {
      return this.findOne({
        query: [field, '==', value]
      });
    };
  }

  async set ({
    id,
    data,
    merge = true,
    assert = false,
    get = true
  }) {
    if (assert) {
      await this.existsAssert({id});
    }
    data = omit(data, 'id');
    this._addUpdatedAt(data);
    const ref = this.doc(id);
    const set = await ref.set(data, {merge});
    return get ? this.get({id}) : set;
  }

  async addOrSetByField ({
    field,
    data,
    add = (x)=> x
  }) {
    const value = data[field];
    const doc = await this.findOneByField(field)(value);
    if (doc) {
      const {id} = doc;
      return this.set({id, data});
    } else {
      data = await add(data);
      return this.add({data});
    }
  }

  /////////////
  // Helpers //
  /////////////

  timestamp () {
    return this.Admin.firestore.FieldValue.serverTimestamp();
  }

  _deleteField () {
    return this.Admin.firestore.FieldValue.delete();
  }

  _snapToDoc (snap) {
    if (snap.exists) {
      const data = snap.data();
      data.id = snap.id;
      return timestampsToDates(data);
    } else {
      return null;
    }
  }

  _id () {
    const ref = this.collection.doc();
    return ref.id;
  }
}
