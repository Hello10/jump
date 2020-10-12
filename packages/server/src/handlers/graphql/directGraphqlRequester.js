import directGraphqlRequest from './directGraphqlRequest';
import makeSchema from './makeSchema';

export default function directGraphqlRequester ({
  Schema,
  Controllers,
  Scalars,
  options,
  buildContext
}) {
  const schema = makeSchema({Schema, Controllers, Scalars, options});
  return async function request ({query, variables}) {
    const context = await buildContext();
    return directGraphqlRequest({schema, context, query, variables});
  };
}
