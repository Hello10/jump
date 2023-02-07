import { makeExecutableSchema } from '@graphql-tools/schema'

import { merge } from '@jump/util'

export function exposeResolvers ({ controllers, logger, models, ...options }) {
  const resolvers = {}
  const resolverTypeDefs = []

  for (const [name, Controller] of Object.entries(controllers)) {
    logger.debug(`Exposing controller ${name}`)
    const controller = new Controller({ logger, models, ...options })
    merge(resolvers, controller.expose())
    resolverTypeDefs.push(controller.typeDefs())
  }

  const typeDefs = resolverTypeDefs.join('\n')

  const schema = makeExecutableSchema({ typeDefs, resolvers })

  return {
    resolvers,
    typeDefs,
    schema
  }
}

export default exposeResolvers
