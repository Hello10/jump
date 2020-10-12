import {ApolloServer} from 'apollo-server-cloud-functions';

import base_logger from '../../logger';
import formatErrorDefault from './formatError';
import makeSchema from './makeSchema';

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

  const {
    server: opts_server = {},
    handler: opts_handler = {},
    controller: opts_controller = {}
  } = options;

  const schema = makeSchema({
    options: opts_controller,
    Schema,
    Controllers,
    Scalars
  });

  logger.debug('Creating ApolloServer', {options: opts_server});
  if (!opts_server.formatError) {
    opts_server.formatError = formatErrorDefault;
  }
  const server = new ApolloServer({...opts_server, schema});

  logger.debug('Creating GraphQL handler', {options: opts_handler});
  return server.createHandler(opts_handler);
}
