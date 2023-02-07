import assert from 'assert'

import now from './now'

describe('now', () => {
  it('should return date representing now', (done) => {
    const a = now()
    setTimeout(() => {
      const b = now()
      assert(a.getTime() < b.getTime())
      done()
    }, 20)
  })
})
