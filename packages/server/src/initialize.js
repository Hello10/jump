import default_logger from './logger';

export default function initialize (options) {
  const {namespace} = options;
  const required = [
    'Admin',
    'Enums',
    'getCollection',
    'getService'
  ];
  for (const name of required) {
    if (!options[name]) {
      throw new Error(`Missing required argument for ${namespace}: ${name}`);
    }
    this[name] = options[name];
  }

  let {logger} = options;
  if (!logger) {
    logger = default_logger;
  }
  this.logger = logger.child(`${namespace}:${this.name}`);
}
