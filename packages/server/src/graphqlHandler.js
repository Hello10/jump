import * as Functions from 'firebase-functions';
import {ApolloServer} from 'apollo-server-cloud-functions';

import makeSchema from './makeSchema';
import contextBuilder from './contextBuilder';
import getTokenDefault from './getToken';

export default function graphqlHandler ({
  Schema,
  Scalars,
  Controllers,
  Collections,
  context,
  getToken = getTokenDefault,
  user_collection = 'User',
  options = {}
}) {
  if (!context) {
    context = contextBuilder({Collections, getToken, user_collection});
  }
  const schema = makeSchema({Schema, Controllers, Scalars});
  const server = new ApolloServer({schema, context});
  const handler = server.createHandler(options);
  return Functions.https.onRequest(handler);
}
