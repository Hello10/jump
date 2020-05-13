import get from 'lodash.get';

export default function getGraphQLErrorCode (error) {
  let code = get(error, 'graphQLErrors[0].extensions.code', null);
  if (!code) {
    code = get(error, 'networkError.result.errors[0].extensions.code', null);
  }
  return code;
}
