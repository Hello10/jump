import {makeExecutableSchema} from 'graphql-tools';
import {merge} from 'lodash';

import debug from './debug';

export default function makeSchema ({Schema, Controllers, Scalars, options}) {
  const resolvers = {};
  for (const [name, Controller] of Object.entries(Controllers)) {
    debug(`Exposing controller ${name}`);
    const controller = new Controller(options);
    // TODO: shouldn't need to instantiate each controller per request,
    // just figure out the dispatch and then instantiate on demand unless
    // there's some memoization that can be done between requests.
    // Super Bonus (whole why): context becomes part of this instead of a var
    merge(resolvers, controller.expose());
  }
  merge(resolvers, Scalars);

  return makeExecutableSchema({
    typeDefs: Schema,
    resolvers
  });
}
