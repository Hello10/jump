import initialize from '../initialize';

export default class Handler {
  constructor ({start, ...options}) {
    this.start = start;
    initialize.call(this, {namespace: 'Handler', ...options});
  }

  get name () {
    throw new Error('Child class must implement .name');
  }

  actions () {
    throw new Error('Handler should implement actions');
  }

  expose () {
    throw new Error('Handler should implement expose');
  }
}
