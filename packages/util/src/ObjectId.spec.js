import assert from 'assert'

import { isObjectId, generateObjectId } from './ObjectId'

describe('ObjectId', () => {
  describe('generateObjectId', () => {
    it('should generate an ObjectId', () => {
      const id = generateObjectId()
      assert(isObjectId(id))
    })
  })

  describe('isObjectId', () => {
    const o1 = '45823ac8e4123f6920012313'
    const o2 = {
      toString () {
        return o1
      }
    }
    assert(isObjectId(o1))
    assert(isObjectId(o2))

    const nos = [
      'foo',
      {
        nope: 1
      },
      [],
      4,
      false,
      null
    ]

    for (const no of nos) {
      assert(!isObjectId(no))
    }
  })
})
