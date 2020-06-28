import {ApolloServer} from 'apollo-server-cloud-functions';

import makeSchema from './makeSchema';
import contextBuilder from './contextBuilder';

function getTokenDefault (request) {
  const header = request.get('Authorization');
  const prefix = /^Bearer /;
  if (header && header.match(prefix)) {
    return header.replace(prefix, '');
  } else {
    return null;
  }
}

export default function graphqlHandler ({
  Collections,
  Controllers,
  Scalars,
  Schema,
  getToken = getTokenDefault,
  loadUserFromToken,
  options = {}
}) {
  const {
    server: opts_server = {},
    handler: opts_handler = {},
    context: opts_context = {}
  } = options;

  if (!opts_server.context) {
    opts_server.context = contextBuilder({
      options: opts_context,
      Collections,
      getToken,
      loadUserFromToken
    });
  }

  const schema = makeSchema({
    options: opts_context,
    Schema,
    Controllers,
    Scalars
  });

  const server = new ApolloServer({...opts_server, schema});
  return server.createHandler(opts_handler);
}
