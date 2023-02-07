import assert from 'assert'

import interval from './interval'

describe('interval', () => {
  it('should create inclusive interval from array', () => {
    assert.deepEqual(
      interval([0, 1]),
      {
        gte: 0,
        lte: 1
      }
    )
  })

  it('should create intervals from strings', () => {
    assert.deepEqual(
      interval('[0, 1]'),
      {
        gte: 0,
        lte: 1
      }
    )

    assert.deepEqual(
      interval('(0, 1]'),
      {
        gt: 0,
        lte: 1
      }
    )

    assert.deepEqual(
      interval('[0, 1)'),
      {
        gte: 0,
        lt: 1
      }
    )

    assert.deepEqual(
      interval('(0, 1)'),
      {
        gt: 0,
        lt: 1
      }
    )
  })

  it('should pass through objects', () => {
    const input = { gt: 5, lte: 11 }
    assert.deepEqual(interval(input), input)
  })

  it('should throw on invalid input', () => {
    const invalid = [
      { gt: 10, gte: 100 },
      { lt: 1, lte: 40 },
      { womp: 10 }
    ]
    for (const input of invalid) {
      assert.throws(() => {
        interval(input)
      })
    }
  })

  it('should allow min and max aliases for gte and lte', () => {
    assert.deepEqual(
      interval({ min: 0, max: 1 }),
      {
        gte: 0,
        lte: 1
      }
    )
  })
})
