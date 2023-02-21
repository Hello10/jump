import assert from 'assert'

import { euclideanDistance } from './geometry'

describe('euclideanDistance', () => {
  it('should calculate euclidean distance', () => {
    const p1 = [0, 0]
    const p2 = [3, 4]
    assert.equal(euclideanDistance(p1, p2), 5)
  })
})