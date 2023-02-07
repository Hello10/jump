import assert from 'assert'

import shortcode from './shortcode'
import { isString } from './type'

describe('shortcode', () => {
  it('should return a readable shortcode', () => {
    const code = shortcode()
    assert(isString(code))
    assert.equal(code.length, 6)
  })
})
