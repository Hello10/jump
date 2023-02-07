import assert from 'assert'

import flattener from './flattener'

describe('flattener', () => {
  it('Should flatten nested', () => {
    const output = flattener()({
      a: {
        b: {
          c: 1
        }
      }
    })
    assert.deepEqual(output, { 'a.b.c': 1 })
  })

  it('Should handle empty objects', () => {
    const output = flattener()({
      a: {}
    })
    assert.deepEqual(output, { a: {} })
  })

  it('Should handle deeply nested properties', () => {
    const obj = {
      a: {
        b: {
          c: 1,
          d: 2,
          x: {
            y: {
              z: [1]
            }
          }
        }
      },
      x: 'test'
    }
    const output = flattener()(obj)
    const expected = {
      'a.b.c': 1,
      'a.b.d': 2,
      'a.b.x.y.z': [1],
      x: 'test'
    }
    assert.deepEqual(output, expected)
  })

  it('Should handle some config params', () => {
    const flatten = flattener({
      join: ':',
      into: { 'o:m:g': 1 }
    })
    const output = flatten({
      o: {
        m: {
          c: 'how bizarre',
          d: 'if you leave'
        }
      }
    })
    const expected = {
      'o:m:g': 1,
      'o:m:d': 'if you leave',
      'o:m:c': 'how bizarre'
    }
    assert.deepEqual(output, expected)
  })
})
