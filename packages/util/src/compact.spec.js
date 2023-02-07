import assert from 'assert'

import compact from './compact'

describe('compact', () => {
  it('should compact arrays', () => {
    const compacted = compact([0, null, 2, false, 'abc'])
    assert.deepEqual(compacted, [2, 'abc'])
  })

  it('should compact objects', () => {
    const compacted = compact({
      hi: true,
      bye: false,
      nope: null,
      ok: 1,
      nah: undefined,
      wow: 'abcd'
    })
    assert.deepEqual(compacted, {
      hi: true,
      ok: 1,
      wow: 'abcd'
    })
  })

  it('should compact strings', () => {
    const compacted = compact('  a b    c d    adsdfs ')
    assert.equal(compacted, 'abcdadsdfs')
  })

  it('should throw with unsupported object', () => {
    assert.throws(() => {
      compact(10)
    })
  })
})
