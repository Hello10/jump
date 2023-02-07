import assert from 'assert'

import buildEnum from './buildEnum'

describe('buildEnum', () => {
  it('should build an enum', () => {
    const output = buildEnum(['one', 'two', 'three'])
    assert.deepEqual(output, {
      one: 'one',
      two: 'two',
      three: 'three'
    })
  })
})
