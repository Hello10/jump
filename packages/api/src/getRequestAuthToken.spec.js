import assert from 'assert'

import getRequestAuthToken from './getRequestAuthToken'

describe('getRequestAuthToken', () => {
  let header
  const request = { headers: { get: () => header } }

  it('should return null if no Authorization header', () => {
    header = null
    const token = getRequestAuthToken({ request })
    assert(token === null)
  })

  it('should return the token when set', () => {
    header = 'Bearer 123'
    const token = getRequestAuthToken({ request })
    assert(token === '123')
  })
})
