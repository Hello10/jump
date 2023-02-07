import assert from 'assert'

import nonempty from './nonempty'

describe('nonempty', () => {
  it('should handle strings', () => {
    assert(nonempty('wow!'))
    assert(!nonempty(''))
  })

  it('should handle arrays', () => {
    assert(nonempty([10]))
    assert(!nonempty([]))
  })

  it('should handle objects', () => {
    assert(nonempty({ x: 10 }))
    assert(!nonempty({}))
  })

  it('should handle numbers', () => {
    assert(nonempty(0))
    assert(nonempty(10))
    assert(nonempty(-0.25))
  })

  it('should handle booleans', () => {
    assert(nonempty(true))
    assert(nonempty(false))
  })

  it('should handle instance of class', () => {
    class Donkey {}
    const donkey = new Donkey()
    assert(nonempty(donkey))
  })

  it('should handle null and undefined', () => {
    assert(!nonempty(null))
    assert(!nonempty(undefined))
  })
})
