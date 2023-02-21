import assert from 'assert'

import { times, range, minMaxArgs, mapRanges } from './iter'

describe('times', () => {
  it('should call a function repeatedly with index', () => {
    const squares = times(9)((i) => i * i)
    assert.deepEqual(squares, [0, 1, 4, 9, 16, 25, 36, 49, 64])
  })
})

describe('range', () => {
  it('should generate a range of numbers when passed object with min and max', () => {
    assert.deepEqual(range({ max: 4 }), [0, 1, 2, 3, 4,])
    assert.deepEqual(range({ min: 5, max: 8 }), [5, 6, 7, 8])
  })

  it('should accept single numeric arg as count (i.e. lodash compatible)', () => {
    assert.deepEqual(range(4), [0, 1, 2, 3])
    assert.deepEqual(range({ count: 2 }), [0, 1])
  })

  it('should accept two numeric args as min and max', () => {
    assert.deepEqual(range(2, 5), [2, 3, 4, 5])
  })

  it('should accept array of two numbers as min and max', () => {
    assert.deepEqual(range([3, 6]), [3, 4, 5, 6])
  })

  it('should handle negative increment across ranges', ()=> {
    assert.deepEqual(range([6, 3]), [6, 5, 4, 3])
  })

  it('should handle returning array with just single element when min and max are the same', () => {
    assert.deepEqual(range(2, 2), [2])
  })

  it('should throw on bad args', () => {
    assert.throws(() => range())
    assert.throws(() => range(1, 2, 3))
    assert.throws(() => range([1, 2, 3]))
    assert.throws(() => range('oops'))
  })
})

describe('minMaxArgs', () => {
  it('should return min and max', () => {
    assert.deepEqual(minMaxArgs({ min: 1, max: 3 }), { min: 1, max: 3 })
    assert.deepEqual(minMaxArgs([1, 3]), { min: 1, max: 3 })
    assert.deepEqual(minMaxArgs(3), { min: 0, max: 3 })
    assert.deepEqual(minMaxArgs(2, 5), { min: 2, max: 5 })
    assert.deepEqual(minMaxArgs(), { min: 0, max: 1})
  })

  it('should throw on invalid args', () => {
    assert.throws(() => minMaxArgs(1, 2, 3))
    assert.throws(() => minMaxArgs('hi'))
    assert.throws(() => minMaxArgs('hi', 'bye'))
  })
})

describe('mapRanges', () => {
  it('should map ranges', () => {
    const input = { min: 0, max: 1 }
    const output = { min: 0, max: 100 }
    const tests = [
      [0, 0],
      [0.333, 33.3],
      [0.5, 50],
      [1, 100]
    ]
    for (const [value, expected] of tests) {
      const actual = mapRanges({ input, output, value })
      assert(Math.abs(actual - expected) < 0.0001)
    }
  })
})
