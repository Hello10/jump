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
  Admin,
  app,
  buildContext,
  Collections,
  Controllers,
  getToken = getTokenDefault,
  loadUserFromToken,
  options = {},
  Scalars,
  Schema
}) {
  console.log('ok making graphql handler', {
    Admin,
    app,
    buildContext,
    Collections,
    Controllers,
    getToken,
    loadUserFromToken,
    options,
    Scalars,
    Schema
  });
  if (!buildContext) {
    buildContext = contextBuilder({Admin, app, Collections, getToken, loadUserFromToken});
  }
  const schema = makeSchema({Schema, Controllers, Scalars});
  const server = new ApolloServer({schema, context: buildContext});
  return server.createHandler(options);
}
