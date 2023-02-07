import assert from 'assert'

import { times, range, minMaxArgs } from './iter'

describe('times', () => {
  it('should call a function repeatedly with index', () => {
    const squares = times(9)((i) => i * i)
    assert.deepEqual(squares, [0, 1, 4, 9, 16, 25, 36, 49, 64])
  })
})

describe('range', () => {
  it('should generate a range of numbers', () => {
    assert.deepEqual(range({ end: 4 }), [0, 1, 2, 3, 4,])
    assert.deepEqual(range({ start: 5, end: 8 }), [5, 6, 7, 8])
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