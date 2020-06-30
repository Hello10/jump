import {ApolloError} from 'apollo-server-cloud-functions';

export class GraphQLError extends ApolloError {
  constructor ({
    code = 'GraphQLError',
    message = 'GraphQL error',
    params
  }) {
    if (message.constructor === Function) {
      message = message(params);
    }
    super(message, code, params);
    this.expected = true;
  }

  is (code) {
    return (this.code === code);
  }
}

export class DocumentDoesNotExistError extends GraphQLError {
  constructor (params) {
    const {type, id} = params;
    super({
      code: 'DocumentDoesNotExist',
      message: `Document ${type} with id ${id} does not exist`,
      params
    });
  }
}

export class NotAuthorizedError extends GraphQLError {
  constructor (params) {
    super({
      code: 'NotAuthorized',
      message: `Not authorized to access ${params.path}`,
      params
    });
  }
}
