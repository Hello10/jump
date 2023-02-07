import { isFunction } from '@jump/util'

import {
  GqlError,
  NotAuthorizedError,
  isPublicError
} from '@jump/shared'

const UNION_RESOLVER_NAME = '__resolveType'

export class Controller {
  constructor ({ logger, models }) {
    this.models = models
    this.logger = logger
  }

  get name () {
    throw new Error('Child class must implement .name')
  }

  resolvers () {
    // Child class should implement this method and return
    // an object with this shape:
    //
    // {
    //   // Mutations resolved in this controller
    //   Mutation: {
    //     <MutationName>: {
    //       resolver: Function,
    //       authorizer: Function
    //     }
    //   },
    //   // Queries resolved in this controller
    //   Query: {
    //     <QueryName>: {
    //       resolver: Function,
    //       authorizer: Function
    //     }
    //   },
    //   // Type fields resolved in this controller
    //   <TypeName>: {
    //     <FieldName>: {
    //       resolver: Function,
    //       authorizer: Function
    //     }
    //   },
    //   // Union types
    //   <UnionTypeName>: {
    //     __resolveType: Function
    //   },
    //   // Scalar types
    //   <ScalarTypeName>: <ScalarResolver>
    // }
    throw new Error('Child class must implement .resolvers')
  }

  expose () {
    const result = {}

    const groups = this.resolvers()
    for (const [type, group] of Object.entries(groups)) {
      const isScalar = group.constructor.name === 'GraphQLScalarType'
      if (isScalar) {
        result[type] = group
        continue
      }

      if (!(type in result)) {
        result[type] = {}
      }

      for (const [name, definition] of Object.entries(group)) {
        const path = `${type}.${name}`

        // Resolve Union types
        // https://www.apollographql.com/docs/graphql-tools/resolvers/#unions-and-interfaces
        if (name === UNION_RESOLVER_NAME) {
          result[type][name] = (obj, context, info) => {
            return definition.call(this, { obj, context, info })
          }
          continue
        }

        for (const field of ['authorizer', 'resolver']) {
          if (!isFunction(definition[field])) {
            const message = `Invalid ${field} definition for ${path}`
            throw new Error(message)
          }
        }

        const { resolver, authorizer } = definition
        result[type][name] = async (obj, args, context, info) => {
          const { user } = context
          const params = { obj, args, context, info, user }

          const rlogger = this.logger.child({
            resolver: name,
            type,
            user,
            obj,
            args
          })

          rlogger.debug(`Calling resolver ${path}`)

          try {
            // Have to handle this explicitly, would be better to have
            // this in context build derp meh
            // const { load_user_error } = context
            // if (load_user_error) {
            //   throw load_user_error
            // }

            const authorized = await authorizer.call(this, params)
            if (!authorized) {
              const error = new NotAuthorizedError({ path })
              rlogger.error(error)
              throw error
            }

            const result = await resolver.call(this, params)
            rlogger.info('Resolver result', { result })
            return result
          } catch (error) {
            if (isPublicError(error)) {
              rlogger.error('Expected GraphQL error', error)
              throw error
            } else {
              rlogger.error(error)
              throw new GqlError()
            }
          }
        }
      }
    }
    return result
  }

  resolveType (getType) {
    return (request) => {
      const type = getType(request)
      return request.info.schema.getType(type)
    }
  }

  addSessionUserId (key) {
    return ({ data, context }) => {
      return {
        ...data,
        [key]: context.user.id
      }
    }
  }

  pass ({ obj, info }) {
    const attr = info.fieldName
    return obj[attr]
  }

  stub () {
    throw new Error('Stub')
  }
}

export default Controller
