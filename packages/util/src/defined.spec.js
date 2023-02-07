import assert from 'assert'

import defined from './defined'

describe('defined', () => {
  it('should check definition', () => {
    let x
    const y = undefined
    const z = 100
    assert.equal(defined(x), false)
    assert.equal(defined(y), false)
    assert.equal(defined(z), true)
  })
})
