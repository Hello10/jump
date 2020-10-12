export default function getGraphQLErrorCode (error) {
  if (error.graphQLErrors) {
    ([error] = error.graphQLErrors);
  }
  return error?.extensions?.code;
}
