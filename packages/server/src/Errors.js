import {ApolloError} from 'apollo-server-cloud-functions';

// TODO: remove once update eslint dep
/*eslint max-classes-per-file: ["error", 100] */

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

export class ResolverMissingError extends GraphQLError {
  constructor (params) {
    super({
      code: 'ResolverMissing',
      message: `Resolver missing: ${params.path}`,
      params
    });
  }
}

export class ResolverAuthorizerMissingError extends GraphQLError {
  constructor (params) {
    super({
      code: 'ResolverAuthorizerMissing',
      message: `Resolver permission missing: ${params.path}`,
      params
    });
  }
}

export class SessionUserNotFoundError extends GraphQLError {
  constructor (params) {
    super({
      code: 'SessionUserNotFound',
      message: `Session user not found: ${params.id}`,
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

export class AuthTokenError extends GraphQLError {
  constructor (params) {
    const {code, message} = params;
    super({
      code: 'AuthToken',
      message: `Auth token error ${code}: ${message}`,
      params
    });
  }
}
