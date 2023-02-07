import { graphql } from 'graphql'

import { isPublicError } from '@jump/shared/index'
import { isFunction, isObject } from '@jump/util'

import exposeResolvers from './exposeResolvers'

async function buildContext (context) {
  let result
  try {
    let initial = {}
    let buildFns = []
    if (Array.isArray(context)) {
      // Context is array of context building functions
      buildFns = context
    } else if (isFunction(context)) {
      // Context is a single build function
      buildFns = [context]
    } else if (isObject(context)) {
      // Context is plain object
      initial = context
    } else {
      throw new Error('Invalid context value')
    }

    result = await buildFns.reduce((result, build) => {
      return result.then(build)
    }, Promise.resolve(initial))
  } catch (error) {
    console.error('Error building context', error)
    throw error
  }
  return result
}

// function buildRootValue(resolvers) {
//   const { Query, Mutation, ...types } = resolvers

//   // const fields = Object.entries(types).reduce((result, [type, fields])=> {
//   //   const typeFields = Object.entries(fields).reduce((tresult, [name, resolver]) => {
//   //     return {
//   //       ...tresult,
//   //       [`${type}.${name}`]: resolver
//   //     }
//   //   }, {})
//   //   return {
//   //     ...result,
//   //     ...typeFields,
//   //   }
//   // }, {})

//   return {
//     ...Query,
//     ...Mutation,

//   }
// }

export function createGqlServer ({ controllers, models, logger, context = {} }) {
  const { schema } = exposeResolvers({
    controllers,
    logger,
    models
  })

  return async (event) => {
    try {
      const { request } = event

      let query
      let variables
      const isGet = request.method === 'GET'
      if (isGet) {
        const url = new URL(request.url)
        const params = new URLSearchParams(url.search)
        query = params.get('query')
        variables = params.get('variables') ?? {}
      } else {
        const body = await new Response(request.body).json()
        query = body.query
        variables = body.variables ?? {}
      }

      console.log('GQL', { query, variables })

      const contextValue = await buildContext({ ...context, request })

      const result = await graphql({
        schema,
        source: query,
        variableValues: variables,
        contextValue
      })

      // setStatusCode(200)
      return result
    } catch (err) {
      console.error(err)
      const isPublic = isPublicError(err)
      const error = isPublic ? err : new Error('Server Error')
      // setStatusCode(500)
      return { error: error.message }
    }
  }
}

export default createGqlServer
