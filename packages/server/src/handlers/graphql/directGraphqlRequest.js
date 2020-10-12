import {graphql} from 'graphql';

import logger from '../../logger';

// https://graphql.org/graphql-js/graphql/#graphql
// graphql(
//   schema: GraphQLSchema,
//   requestString: string,
//   rootValue?: ?any,
//   contextValue?: ?any,
//   variableValues?: ?{[key: string]: any},
//   operationName?: ?string
// ): Promise<GraphQLResult>

export default async function directGraphqlRequest ({schema, context, query, variables}) {
  const rlogger = logger.child({
    name: 'localGraphqlRequest',
    query,
    variables
  });
  rlogger.debug('Making request');

  const root = {};
  const response = await graphql(schema, query, root, context, variables);
  const {data, errors} = response;

  if (errors) {
    const error = errors[0];
    rlogger.error(error);
    throw error;
  } else {
    rlogger.debug('Got response', {data});
    return data;
  }
}
