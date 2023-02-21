import {
  useContext,
  createContext,
  useState,
  useEffect
} from 'react'

export const GqlContext = createContext({
  query: null,
  mutation: null,
  variables: {},
  fetching: false,
  fetched: false,
  data: null,
  error: null,
  fetch: ()=> {},
  refetch: ()=> {}
})

export function useGqlContext () {
  return useContext(GqlContext)
}

export function GqlProvider ({ getToken = () => { return null }, children }) {
  const context = {
    getToken
  }

  return (
    <GqlContext.Provider value={context}>
      {children}
    </GqlContext.Provider>
  )
}

export function useGql ({
  query,
  mutation,
  headers = {},
  variables: baseVariables = {},
  auto = false
}) {
  const [fetching, setFetching] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [variables, setVariables] = useState({})
  const { getToken } = useGqlContext()

  if (!query && !mutation) {
    throw new Error('Must pass query or mutation')
  }

  async function fetch ({ variables: fetchVariables = {} } = {}) {
    if (fetching()) {
      return {
        error: null,
        data: null
      }
    }

    const token = await getToken()
    const auth = token ? `Bearer ${token}` : null

    const variables = {
      ...baseVariables,
      ...fetchVariables
    }

    setFetching(true)
    setVariables(variables)
    setData(null)
    setError(null)

    try {
      const { data, errors } = await makeGqlRequest({
        query: query || mutation,
        variables,
        headers: {
          ...(auth ? { Authorization: auth } : {}),
          ...headers
        }
      })

      setFetching(false)
      setFetched(true)

      if (errors?.length) {
        const gqlError = errors[0]
        const error = new Error(gqlError.message)
        error.gql = gqlError
        error.code = gqlError?.extensions.code
        setError(error)
        setData(null)

        return {
          error,
          data: null
        }
      } else {
        setError(null)
        setData(data)

        return {
          error: null,
          data
        }
      }
    } catch (error) {
      setFetching(false)
      setFetched(true)

      setError(error)
      setData(null)

      return {
        error,
        data: null
      }
    }
  }

  function refetch (args) {
    if (fetching()) {
      return Promise.resolve()
    }
    setFetched(false)
    setError(null)
    return fetch(args)
  }

  useEffect(() => {
    if (auto) {
      fetch()
    }
  }, [])

  return {
    query,
    mutation,
    variables,
    fetching,
    fetched,
    fetch,
    refetch,
    data,
    error
  }
}

export function makeUseGql (opts) {
  return (callOpts = {}) => {
    return useGql({
      ...opts,
      ...callOpts
    })
  }
}

async function makeGqlRequest ({ query, headers = {}, variables = {} }) {
  const response = await global.fetch('/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({
      query,
      variables
    })
  })
  const json = await response.json()
  return json
}
