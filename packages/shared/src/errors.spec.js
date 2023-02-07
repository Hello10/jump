import assert from 'assert'

import { GqlError, isPublicError, DataTimeoutError } from './errors'

describe('errors', () => {
  it('should identify public errors', () => {
    const error = new GqlError()
    assert(isPublicError(error))

    const error2 = new DataTimeoutError()
    assert(isPublicError(error2))

    const error3 = new Error()
    assert(!isPublicError(error3))
  })
})
