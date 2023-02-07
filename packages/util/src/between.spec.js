import assert from 'assert'

import { betweener } from './between'

describe('betweener', () => {
  it('should test intervals', () => {
    const betweens = [
      betweener('(-1.5, 3.5)'),
      betweener('[-1.5, 3.5)'),
      betweener('(-1.5, 3.5]'),
      betweener('[-1.5, 3.5]')
    ]

    const tests = [
      [-1.75, [false, false, false, false]],
      [-1.5, [false, true, false, true]],
      [0.25, [true, true, true, true]],
      [3.5, [false, false, true, true]],
      [5, [false, false, false, false]]
    ]

    for (const [value, expects] of tests) {
      for (let i = 0; i < betweens.length; i++) {
        const between = betweens[i]
        const expect = expects[i]
        assert.equal(between(value), expect)
      }
    }
  })

  it('should allow Infinity', () => {
    const lessThan10 = betweener('(-∞,10)')
    assert.equal(lessThan10(-100000), true)
    assert.equal(lessThan10(10), false)

    const anything = betweener('(-∞, ∞)')
    assert.equal(anything(101010110), true)
    assert.equal(anything(-10234123434), true)
  })

  it('should throw on bad input', () => {
    assert.throws(() => {
      betweener('abcd')
    })
  })
})
