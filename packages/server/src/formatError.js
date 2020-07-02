import * as GraphQL from 'graphql';

import logger from './logger';
import {GraphQLError} from './Errors';

export default function formatError (error) {
  logger.error(error);

  let data = GraphQL.formatError(error);

  const {originalError: oerror} = error;
  if (oerror && oerror.expected) {
    data.code = oerror.code;
  } else {
    // Handle context creation errors don't include original
    // const missing = error.message.match(/Missing session user ([^\s]{24})/);
    // let public_error;
    // if (missing) {
    //   const id = missing[1];
    //   public_error = new Errors.SessionUserMissing({id});
    // } else {
    //   public_error = new Errors.Public();
    // }
    const public_error = new GraphQLError();
    data = GraphQL.formatError(public_error);
    data.code = public_error.code;
  }

  return data;
}
