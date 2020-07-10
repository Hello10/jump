import {merge} from 'lodash';

import logger from '../../logger';

export default function exposeResolvers ({Controllers, Scalars, options}) {
  const resolvers = {};
  for (const [name, Controller] of Object.entries(Controllers)) {
    logger.debug(`Exposing controller ${name}`);
    const controller = new Controller(options);
    merge(resolvers, controller.expose());
  }
  merge(resolvers, Scalars);
  return resolvers;
}
