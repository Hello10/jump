import Admin from 'firebase-admin';
import DataLoader from 'dataloader';
import {omit, uniq, isNumber, isObject} from 'lodash';

import timestampsToDates from './timestampsToDates';
import {DocumentDoesNotExistError} from './Errors';

export default class Collection {
  static get (args) {
    return new this(args);
  }

  constructor ({getCollection, getLoader}) {
    this.getCollection = getCollection;
    this.getLoader = getLoader;
  }

  get name () {
    throw new Error('Collection child class must implement .name');
  }

  get db () {
    return Admin.firestore();
  }

  get collection () {
    return this.db.collection(this.name);
  }

  doc (id) {
    return this.collection.doc(id);
  }

  get loader () {
    return new DataLoader((ids)=> {
      return this.getMany({ids});
    });
  }

  //////////
  // CRUD //
  //////////
  async add ({data}) {
    data = omit(data, 'id');
    const timestamp = this._timestampField();
    data.created_at = timestamp;
    data.updated_at = timestamp;
    const ref = await this.collection.add(data);
    data.id = ref.id;
    return data;
  }

  async set ({id, data, merge = true}) {
    data = omit(data, 'id');
    data.updated_at = this._timestampField();
    const ref = this.doc(id);
    await ref.set(data, {merge});
    return this.get({id});
  }

  async addOrSetByField ({field, data, add = (x)=> x}) {
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

  async getOrAddById ({id, data, add = (x)=> x}) {
    let user = await this.get({id});
    if (!user) {
      data = await add({id, data});
      user = await this.set({id, data, merge: false});
    }
    return user;
  }

  async exists (id) {
    const ref = this.doc(id);
    const snap = await ref.get();
    return snap.exists;
  }

  async get ({id, assert = false}) {
    const ref = this.doc(id);
    const snap = await ref.get();
    if (assert && !snap.exists) {
      const error = this._doesNotExistError(id);
      throw error;
    }
    return this._snapToDoc(snap);
  }

  async getMany ({ids}) {
    if (!ids || ids.length === 0) {
      return [];
    }

    const uniques = uniq(ids);
    const refs = uniques.map((id)=> this.doc(id));
    const snaps = await this.db.getAll(refs);
    const docs = snaps.map((snap)=> this._snapToDoc(snap));

    const docs_by_id = {};
    for (const doc of docs) {
      if (doc) {
        docs_by_id[doc.id] = doc;
      }
    }

    return ids.map((id)=> {
      return (id in docs_by_id) ? docs_by_id[id] : null;
    });
  }

  async find ({where, limit, order_by, select} = {}) {
    let query = this.collection;

    function invalid (field) {
      throw new Error(`Invalid ${field} for find`);
    }

    if (where) {
      let parts;
      if (isObject(where)) {
        parts = Object.entries(where).map(([field, value])=> {
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

  async findOne ({where, order_by, select}) {
    const docs = await this.find({
      limit: 1,
      where,
      order_by,
      select
    });
    return (docs.length > 0) ? docs[0] : null;
  }

  findOneByField (field) {
    return (value)=> {
      return this.findOne({
        where: [field, '==', value]
      });
    };
  }

  async delete ({id, ids, where}) {
    if (id) {
      const ref = this.doc(id);
      return ref.delete();
    }

    if (ids && where) {
      throw new Error('Delete call should pass ids or where not both');
    }

    if (where) {
      const docs = await this.find({where});
      ids = docs.map(({id})=> id);
    }

    if (ids.length === 0) {
      return Promise.resolve();
    }

    const batch = this.db.batch();
    for (const id of ids) {
      const ref = this.doc(id);
      batch.delete(ref);
    }
    return batch.commit();
  }

  /////////////
  // Helpers //
  /////////////

  _timestampField () {
    return Admin.firestore.FieldValue.serverTimestamp();
  }

  _deleteField () {
    return Admin.firestore.FieldValue.delete();
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

  _doesNotExistError (id) {
    const type = this.name();
    return new DocumentDoesNotExistError({type, id});
  }

  _id () {
    const ref = this.collection.doc();
    return ref.id;
  }
}
