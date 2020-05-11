export default function getGraphQLErrorCode (error) {
  let code = error?.graphQLErrors?.[0]?.extensions?.code;
  if (!code) {
    code = error?.networkError?.result?.errors?.[0]?.extensions?.code;
  }
  return code;
}
