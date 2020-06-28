import DataLoader from 'dataloader';

export default class Collection {
  static get (args) {
    return new this(args);
  }

  get name () {
    throw new Error('Collection child class must implement .name');
  }

  get collection () {
    throw new Error('Collection child class must implement .collection');
  }

  get loader () {
    return new DataLoader((ids)=> {
      return this.getMany({ids});
    });
  }

  //////////
  // CRUD //
  //////////

  // TODO: generalize the safe thing derp


  create (/* {data} */) {
    throw new Error('Collection child class must implement .create');
  }

  exists (/* {id} */) {
    throw new Error('Collection child class must implement .exists');
  }

  get (/* {id, safe = false} */) {
    throw new Error('Collection child class must implement .get');
  }

  getSafe ({id}) {
    return this.get({id, safe: true});
  }

  getMany (/* {ids, safe = false} */) {
    throw new Error('Collection child class must implement .getMany');
  }

  getManySafe ({ids}) {
    return this.getMany({ids, safe: true});
  }

  find () {
    // TODO:
  }

  set (/* {id, data, safe = false} */) {
    throw new Error('Collection child class must implement .set');
  }

  setSafe ({id, data}) {
    return this.setMany({id, data, safe: true});
  }

  merge (/* {id, data, safe = false} */) {
    throw new Error('Collection child class must implement .merge');
  }

  mergeSafe ({id, data}) {
    return this.merge({id, data, safe: true});
  }

  delete (/* {id, safe = false} */) {
    throw new Error('Collection child class must implement .delete');
  }

  deleteSafe ({id}) {
    return this.delete({id, safe: true});
  }
}
