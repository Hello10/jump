import {merge} from 'lodash';

import logger from './logger';

export default function expose ({Controllers, Scalars, options}) {
  const resolvers = {};
  for (const [name, Controller] of Object.entries(Controllers)) {
    logger.debug(`Exposing controller ${name}`);
    const controller = new Controller(options);
    // TODO: shouldn't need to instantiate each controller per request,
    // just figure out the dispatch and then instantiate on demand unless
    // there's some memoization that can be done between requests.
    // that way context also becomes part of this instead of only request var
    merge(resolvers, controller.expose());
  }
  merge(resolvers, Scalars);
  return resolvers;
}
