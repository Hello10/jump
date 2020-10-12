import logger from '../../logger';
import addInstanceGetters from '../addInstanceGetters';

export default function createPubSubHandler ({Handler, options}) {
  options = addInstanceGetters(options.handler);

  logger.debug('Creating PubSub Handler', {
    name: 'createPubSubHandler',
    options,
    Handler
  });
  const handler = new Handler(options);
  return handler.expose();
}
