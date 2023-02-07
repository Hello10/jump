import assert from 'assert'

import get from './get'

describe('get', () => {
  it('should get a nested property from an object', () => {
    const obj = { a: { b: { c: 1 } } }
    assert.equal(get(obj, 'a.b.c'), 1)
  })

  it('should allow for a default value', () => {
    const obj = { a: { b: { c: 1 } } }
    assert.equal(get(obj, 'a.b.d', 2), 2)
  })

  it('should return undefined if the path is not found', () => {
    const obj = { a: { b: { c: 1 } } }
    assert.equal(get(obj, 'a.b.d'), undefined)
  })

  it('should handle null path', () => {
    const obj = { a: { b: { c: 1 } } }
    assert.equal(get(obj, null), undefined)
  })

  it('should handle null value', () => {
    assert.equal(get(null, 'a.b.c'), undefined)
  })
})
