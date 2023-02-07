import assert from 'assert'

import merge from './merge'

describe('merge', () => {
  it('should handle merging basic objects', () => {
    const a = { a: 1 }
    const b = { b: 2 }
    const c = { c: 3 }
    const merged = merge(a, b, c)
    assert.deepEqual(merged, { a: 1, b: 2, c: 3 })
  })

  it('should handle merging nested objects', () => {
    const a = { a: 1 }
    const b = { b: { c: 2 } }
    const c = { b: { d: 3 } }
    const merged = merge(a, b, c)
    assert.deepEqual(merged, { a: 1, b: { c: 2, d: 3 } })
  })

  it('should handle null arguments', () => {
    const a = { a: 1 }
    const b = { b: 2 }
    const c = null
    const merged = merge(a, b, c)
    assert.deepEqual(merged, { a: 1, b: 2 })
  })

  it('should handle overwriting from left to write', () => {
    const a = { a: 1 }
    const b = { a: 2 }
    const c = { a: 3 }
    const merged = merge(a, b, c)
    assert.deepEqual(merged, { a: 3 })
  })
})
