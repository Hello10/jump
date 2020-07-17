import {makeExecutableSchema} from 'graphql-tools';
import {ApolloServer} from 'apollo-server-cloud-functions';

import base_logger from '../../logger';
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
  const logger = base_logger.child({
    name: 'createGraphqlHandler',
    options
  });

  logger.debug('Creating GraphQL handler');

  const {
    server: opts_server = {},
    handler: opts_handler = {},
    controller: opts_controller = {}
  } = options;

  if (!opts_server.formatError) {
    opts_server.formatError = formatErrorDefault;
  }

  const processed_options = processOptions(opts_controller);
  logger.debug('Making schema');
  const schema = makeSchema({
    options: processed_options,
    Schema,
    Controllers,
    Scalars
  });

  logger.debug('Creating server', {options: opts_server});
  const server = new ApolloServer({...opts_server, schema});

  logger.debug('Creating handler', {options: opts_handler});
  return server.createHandler(opts_handler);
}
