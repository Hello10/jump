import {makeExecutableSchema} from 'graphql-tools';

import exposeResolvers from './exposeResolvers';
import addInstanceGetters from '../addInstanceGetters';
import logger from '../../logger';

export default function makeSchema ({Schema, Controllers, Scalars, options = {}}) {
  logger.debug('Making schema', {name: 'makeSchema', options});
  options = addInstanceGetters(options);
  const resolvers = exposeResolvers({Controllers, Scalars, options});
  return makeExecutableSchema({
    typeDefs: Schema,
    resolvers
  });
}
