import logger from '../../logger';
import processOptions from '../processOptions';

export default function createPubSubHandler ({Handler, options}) {
  options = processOptions(options.handler);

  logger.debug('Creating PubSub Handler', {
    name: 'createPubSubHandler',
    options,
    Handler
  });
  const handler = new Handler(options);
  return handler.expose();
}
