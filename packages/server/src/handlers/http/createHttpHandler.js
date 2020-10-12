import Express from 'express';
import Cors from 'cors';

import logger from '../../logger';
import addInstanceGetters from '../addInstanceGetters';

export default function createHttpHandler ({Handler, options}) {
  const app = Express();
  const cors = Cors(options.cors);
  app.use(cors);

  options = addInstanceGetters(options.handler);

  logger.debug('Creating HTTP Handler', {
    name: 'createHttpHandler',
    options,
    Handler
  });
  const handler = new Handler(options);
  handler.expose(app);

  return app;
}
