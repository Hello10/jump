import {makeExecutableSchema} from 'graphql-tools';

import expose from './expose';

export default function makeSchema ({Schema, Controllers, Scalars, options}) {
  const resolvers = expose({Controllers, Scalars, options});
  return makeExecutableSchema({
    typeDefs: Schema,
    resolvers
  });
}
