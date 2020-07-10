// TODO: move this to utils, would be generally useful
function instanceGetter ({Constructors, options}) {
  return function getter (name) {
    const Constructor = Constructors[name];
    if (!Constructor) {
      const msg = `Constructor with name ${name} does not exist`;
      throw new Error(msg);
    }
    return Constructor.instance(options);
  };
}

export default function processOptions (input) {
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
