import React from 'react'

export function GqlPage ({
  useQuery,
  loading: Loading,
  error: Error,
  ready: Ready,
  variables = {}
}) {
  const query = useQuery({ auto: true, variables })

  const { fetching, fetched, error, data } = query

  if (fetching || !fetched) {
    return <Loading query={query} />
  }

  if (error) {
    return <Error error={error} query={query} />
  }

  return <Ready data={data} query={query} />
}
