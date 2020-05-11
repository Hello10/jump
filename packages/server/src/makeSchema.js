import {makeExecutableSchema} from 'graphql-tools';
import {merge} from 'lodash';

export default function makeSchema ({Schema, Controllers, Scalars}) {
  const resolvers = {};
  for (const [name, Controller] of Object.entries(Controllers)) {
    console.log(`Exposing controller ${name}`);
    const controller = new Controller();
    merge(resolvers, controller.expose());
  }
  merge(resolvers, Scalars);

  return makeExecutableSchema({
    typeDefs: Schema,
    resolvers
  });
}
