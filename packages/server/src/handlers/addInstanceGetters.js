import logger from '../logger';

// TODO: move this to utils, would be generally useful
function instanceGetter ({Constructors, options}) {
  return function getter (name) {
    if (!(name in Constructors)) {
      const msg = `Constructor with name ${name} does not exist`;
      throw new Error(msg);
    }
    const Constructor = Constructors[name];
    return Constructor.instance(options);
  };
}

export default function addInstanceGetters (input) {
  logger.debug('Processing options', {
    name: 'addInstanceGetters',
    input
  });
  const {Services, Collections, ...options} = input;

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
