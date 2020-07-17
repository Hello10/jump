import base_logger from '../../logger';
import processOptions from '../processOptions';
import getTokenDefault from './getToken';

export default function contextBuilder ({
  loadSession,
  getToken = getTokenDefault,
  start = ()=> {},
  ...input_options
}) {
  return async ({req: request} = {})=> {
    // TODO: support serializers in logger
    const logger = base_logger.child('contextBuilder');

    await start();

    const options = processOptions(input_options);
    const {getCollection} = options;

    const loaders = {};
    function getLoader (arg) {
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

    logger.debug('Getting token');
    const token = getToken(request);
    if (token) {
      try {
        logger.debug('Loading session');
        ({session_id, user_id, user} = await loadSession({token, getCollection}));
        logger.debug('Loaded session', {session_id, user});
      } catch (error) {
        logger.error('Error loading session', error);
        load_user_error = error;
      }
    }

    return {
      session_id,
      user_id,
      user,
      load_user_error,
      getLoader,
      ...options
    };
  };
}
