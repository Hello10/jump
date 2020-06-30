import {ApolloServer} from 'apollo-server-cloud-functions';

import makeSchema from './makeSchema';
import formatErrorDefault from './formatError';

export default function graphqlHandler ({
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
    options: opts_controller,
    Schema,
    Controllers,
    Scalars
  });

  const server = new ApolloServer({...opts_server, schema});
  return server.createHandler(opts_handler);
}
