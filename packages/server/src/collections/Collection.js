import DataLoader from 'dataloader';
import {compact} from 'lodash';
import {mapp, singleton} from '@hello10/util';

import initialize from '../initialize';

export default class Collection {
  constructor (options) {
    initialize.call(this, {namespace: 'Collection', ...options});
  }

  bucket (name) {
    return this.Admin.storage().bucket(name);
  }

  // Leaf child classes MUST overide name getter that the name of the
  // collection backing this collection
  // ================================================================
  get name () {
    throw new Error('Collection child class must implement .name');
  }

  // Implementation child classes MUST overide collection getter that
  // returns a collection instance from the backing database
  // ================================================================
  get collection () {
    throw new Error('Collection child class must implement .collection');
  }

  // Implementation child classes MUST override unimplemented methods
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

  create (/* {data} */) {
    throw new Error('Collection child class must implement .create');
  }

  createAll ({datas}) {
    return mapp(datas, (data)=> this.create({data}));
  }

  async findOrCreate ({query, data}) {
    const doc = await this.findOne({query});
    return doc || this.create({data});
  }

  ///////////////
  // Core:Read //
  ///////////////

  exists (/* {id, assert = false} */) {
    throw new Error('Collection child class must implement .exists');
  }

  existsAssert ({id}) {
    return this.exists({id, assert: true});
  }

  async existsAll ({ids, assert = false}) {
    const docs = await this.getAll({ids, assert});
    return docs.every((doc)=> !!doc);
  }

  existsAllAssert ({ids}) {
    return this.existsAll({ids, assert: true});
  }

  get (/* {id, assert = false} */) {
    throw new Error('Collection child class must implement .get');
  }

  getAssert ({id}) {
    return this.get({id, assert: true});
  }

  getAll (/* {ids, assert = false} */) {
    throw new Error('Collection child class must implement .getAll');
  }

  getAllAssert ({ids}) {
    return this.getAll({ids, assert: true});
  }

  find (/* {query, limit, sort, at, after, select} = {} */) {
    throw new Error('Collection child class must implement .find');
  }

  async findOne ({query, sort, select}) {
    const docs = await this.find({
      limit: 1,
      query,
      sort,
      select
    });
    return (docs.length > 0) ? docs[0] : null;
  }

  async findIds ({query}) {
    const docs = await this.find({query, select: ['id']});
    return docs.map(({id})=> id);
  }

  async list ({limit, sort, at, after} = {}) {
    return this.find({limit, sort, at, after});
  }

  /////////////////
  // Core:Update //
  /////////////////

  update (/* {id, data, merge = true, assert = false} */) {
    throw new Error('Collection child class must implement .update');
  }

  updateAssert ({id, data, merge = true}) {
    return this.update({id, data, merge, assert: true});
  }

  async updateAll ({ids, data, merge = true, assert = false}) {
    this._addUpdatedAt(data);
    return mapp(ids, (id)=> {
      return this.update({id, data, merge, assert});
    });
  }

  updateAllAssert ({ids, data, merge = true}) {
    return this.update({ids, data, merge, assert: true});
  }

  async updateMany ({query, data, merge = true}) {
    const ids = await this.findIds({query});
    return this.updateAll({ids, data, merge});
  }

  /////////////////
  // Core:Delete //
  /////////////////

  delete (/* {id, assert = true} */) {
    throw new Error('Collection child class must implement .delete');
  }

  deleteAssert ({id}) {
    return this.delete({id, assert: true});
  }

  deleteAll (/* {ids} */) {
    throw new Error('Collection child class must implement .deleteAll');
  }

  async deleteMany ({query}) {
    const ids = await this.findIds({query});
    return this.deleteAll({ids});
  }

  /////////////
  // Loaders //
  /////////////

  get loader () {
    const loader = new DataLoader(async (ids)=> {
      this.logger.debug({
        message: `calling DataLoader for ${this.name}`,
        ids
      });

      const docs = await this.getAll({ids});

      const lookup = new Map();
      for (const doc of docs) {
        lookup.set(doc.id.toString(), doc);
      }

      return ids.map((id)=> {
        const id_s = id.toString();
        return lookup.has(id_s) ? lookup.get(id_s) : null;
      });
    });

    loader.loadManyCompact = async function loadManyCompact (ids) {
      const docs = await loader.loadMany(ids);
      return compact(docs);
    };

    return loader;
  }

  /////////////
  // Helpers //
  /////////////

  timestamp () {
    return new Date();
  }

  _addTimestamps (obj, time) {
    if (!time) {
      time = this.timestamp();
    }
    this._addCreatedAt(obj, time);
    this._addUpdatedAt(obj, time);
    return obj;
  }

  _addCreatedAt (obj, time) {
    if (!('created_at' in obj)) {
      obj.created_at = time || this.timestamp();
    }
    return obj;
  }

  _addUpdatedAt (obj, time) {
    if (!('updated_at' in obj)) {
      obj.updated_at = time || this.timestamp();
    }
    return obj;
  }
}

singleton(Collection);
