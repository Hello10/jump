import base_logger from './logger';
import getTokenDefault from './getToken';

export default function contextBuilder ({
  Collections,
  loadSession,
  options,
  getToken = getTokenDefault,
  onLoad = ()=> {}
}) {
  let loaded = false;
  return async ({req})=> {
    // TODO: support serializers in logger
    const logger = base_logger.child({
      name: 'contextBuilder',
      req: {
        url: req.url,
        method: req.method,
        protocol: req.protocol,
        requestId: req.requestId,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        headers: req.headers
      }
    });

    if (!loaded) {
      logger.debug('calling onLoad');
      await onLoad();
      loaded = true;
    }

    const loaders = {};
    function getLoader (arg) {
      const name = arg.name || arg;
      if (!(name in loaders)) {
        const collection = getCollection(name);
        loaders[name] = collection.loader;
      }
      return loaders[name];
    }

    function getCollection (arg) {
      const name = arg.name || arg;
      const Collection = Collections[name];
      if (!Collection) {
        const msg = `Collection with name ${name} does not exist`;
        logger.error(msg);
        throw new Error(msg);
      }

      return Collection.get({
        getCollection,
        getLoader,
        ...options
      });
    }

    let session_id = null;
    let user_id = null;
    let user = null;
    let load_user_error = null;

    const token = getToken(req);
    if (token) {
      try {
        ({session_id, user_id, user} = await loadSession({token, getCollection}));
        logger.debug('Loaded session', {session_id, user});
      } catch (error) {
        logger.error('Error loading session', error);
        load_user_error = error;
      }
    }

    return {
      getCollection,
      getLoader,
      session_id,
      user_id,
      user,
      load_user_error,
      ...options
    };
  };
}
