import assert from 'assert'

import rounder from './rounder'

describe('rounder', () => {
  it('should round numbers to specified precision', () => {
    const round = rounder()
    const round2 = rounder({ decimals: 2 })
    const round3 = rounder({ decimals: 3 })
    const num = 10.3457891
    assert.equal(round(num), 10)
    assert.equal(round2(num), 10.35)
    assert.equal(round3(num), 10.346)
  })

  it('should allow op to specified', () => {
    const num = 101.3259822
    const round3floor = rounder({ decimals: 3, op: Math.floor })
    const round5ceil = rounder({ decimals: 5, op: Math.ceil })
    assert.equal(round3floor(num), 101.325)
    assert.equal(round5ceil(num), 101.32599)
  })

  it('should error on bad args', () => {
    assert.throws(() => {
      rounder({ decimals: -1 })
    })
    assert.throws(() => {
      rounder({ decimals: 1.34 })
    })
    assert.throws(() => {
      rounder({ decimals: 3, op: 'fart' })
    })
  })
})
