import assert from 'assert'

import identity from './identity'

describe('identity', () => {
  it('should return the same thing it is called with', () => {
    assert(identity(1) === 1)
  })
})
