import Express from 'express';
import Cors from 'cors';

import processOptions from '../processOptions';

export default function createHttpHandler ({Handler, options}) {
  const app = Express();
  const cors = Cors(options.cors);
  app.use(cors);

  options = processOptions(options.handler);
  const handler = new Handler(options);
  handler.expose(app);

  return app;
}
