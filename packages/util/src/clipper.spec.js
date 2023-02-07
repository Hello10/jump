import assert from 'assert'

import clipper from './clipper'

describe('clipper', () => {
  it('should clip min', () => {
    const nonNegative = clipper({ gte: 0 })
    assert.equal(nonNegative(100), 100)
    assert.equal(nonNegative(0), 0)
    assert.equal(nonNegative(-10), 0)
  })

  it('should clip max', () => {
    const tenOrLess = clipper({ lte: 10 })
    assert.equal(tenOrLess(-110), -110)
    assert.equal(tenOrLess(10), 10)
    assert.equal(tenOrLess(11), 10)
  })

  it('should clip interval', () => {
    const zeroToOne = clipper([0, 1])
    assert.equal(zeroToOne(-1), 0)
    assert.equal(zeroToOne(0), 0)
    assert.equal(zeroToOne(0.5), 0.5)
    assert.equal(zeroToOne(1), 1)
    assert.equal(zeroToOne(100), 1)
  })

  it('should clip interval exclusive', () => {
    const betweenZeroAndOne = clipper('(0, 1)')
    assert.equal(betweenZeroAndOne(-1), 0 + Number.MIN_VALUE)
    assert.equal(betweenZeroAndOne(0.5), 0.5)
    assert.equal(betweenZeroAndOne(1), 1 - Number.MIN_VALUE)
  })
})
