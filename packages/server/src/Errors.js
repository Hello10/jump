import {ApolloError} from 'apollo-server-cloud-functions';

export class GraphQLError extends ApolloError {
  constructor ({
    code = 'GraphQLError',
    message = 'Server error',
    params
  } = {}) {
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

export class DoesNotExistError extends GraphQLError {
  constructor (params) {
    super({
      code: 'DoesNotExist',
      message: ({type, id, ids, query})=> {
        let missing = '';
        if (id) {
          missing = ` for id = ${id}`;
        } else if (ids) {
          missing = ` for ids = [${ids.join(',')}]`;
        } else if (query) {
          missing = ` for query = ${query}`;
        }
        return `Could not find ${type}${missing}`;
      },
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
