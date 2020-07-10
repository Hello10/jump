import {makeExecutableSchema} from 'graphql-tools';
import {ApolloServer} from 'apollo-server-cloud-functions';

import processOptions from '../processOptions';
import formatErrorDefault from './formatError';
import exposeResolvers from './exposeResolvers';

function makeSchema ({Schema, Controllers, Scalars, options}) {
  const resolvers = exposeResolvers({Controllers, Scalars, options});
  return makeExecutableSchema({
    typeDefs: Schema,
    resolvers
  });
}

export default function createGraphqlHandler ({
  Controllers,
  Scalars,
  Schema,
  options = {}
}) {
  const {
    server: opts_server = {},
    handler: opts_handler = {},
    controller: opts_controller = {}
  } = options;

  if (!opts_server.formatError) {
    opts_server.formatError = formatErrorDefault;
  }

  const schema = makeSchema({
    options: processOptions(opts_controller),
    Schema,
    Controllers,
    Scalars
  });

  const server = new ApolloServer({...opts_server, schema});
  return server.createHandler(opts_handler);
}
