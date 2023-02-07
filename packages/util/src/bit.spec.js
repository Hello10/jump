import assert from 'assert'

import bit from './bit'

describe('bit', () => {
  it('should convert to 1 or 0', () => {
    assert.equal(bit(10), 1)
    assert.equal(bit(0), 0)
    assert.equal(bit(''), 0)
    assert.equal(bit('hi'), 1)
    assert.equal(bit(null), 0)
  })
})
