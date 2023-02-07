import assert from 'assert'

import { compose, iterate } from './combinators'

describe('combinators', () => {
  describe('compose', () => {
    it('should compose', () => {
      const composed = compose(
        (x) => ['foo', x],
        (x) => ['bar', x],
        (x) => ['baz', x]
      )
      const result = composed('z')
      assert.deepEqual(result, ['foo', ['bar', ['baz', 'z']]])
    })
  })

  describe('iterate', () => {
    it('should iterate', () => {
      const threesquare = iterate(3)((x) => x * x)
      const result = threesquare(5)
      assert.equal(result, 390625)
    })
  })
})
