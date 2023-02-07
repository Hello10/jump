import assert from 'assert'

import {
  randomInt,
  randomIntMaker,
  randomIndex,
  randomElement,
  randomFloat
} from './random'
import { assert50 } from './tests'

describe('randomInt', () => {
  it('should generate random int', () => {
    const one = randomInt({ min: 1, max: 1 })
    assert.equal(one, 1)
    assert50(() => {
      const digit = randomInt({ min: 0, max: 9 })
      return ((digit >= 0) && (digit <= 9))
    })
  })

  it('should accept integer agument', () => {
    assert50(() => {
      const degree = randomInt(360)
      return ((degree >= 0) && (degree <= 360))
    })
  })

  it('should accept array argument', () => {
    assert50(() => {
      const num = randomInt([5, 11])
      return ((num >= 5) && (num <= 11))
    })
  })

  it('should handle floats as min/max', () => {
    assert50(() => {
      const num = randomInt({ min: 1.1, max: 3.4 })
      return ((num >= 1) && (num <= 3))
    })
  })

  it('should default to zero and one', () => {
    let seen0 = false
    let seen1 = false
    for (let i = 0; i < 50; i++) {
      const zeroOrOne = randomInt()
      if (zeroOrOne === 0) {
        seen0 = true
      }
      if (zeroOrOne === 1) {
        seen1 = true
      }
      assert([0, 1].includes(zeroOrOne))
    }
    assert(seen0 && seen1)
  })

  it('should throw on bad inputs', () => {
    assert.throws(() => {
      randomInt({ min: 100, max: 1 })
    })
    assert.throws(() => {
      randomInt({ min: 101.101 })
    })
  })

  it('should handle floats', () => {
    assert50(() => {
      const num = randomInt({ min: 1.1, max: 3.4 })
      return ((num >= 1) && (num <= 3))
    })
  })
})

describe('randomIntMaker', () => {
  it('should generate function that generates random int', () => {
    const min = 1
    const max = 10
    const randomi = randomIntMaker({ min, max})
    assert50(() => {
      const num = randomi()
      return ((num >= min) && (num <= max))
    })
  })
})

describe('randomIndex', () => {
  it('should generate random index', () => {
    assert50(() => {
      const index = randomIndex([1, 2, 3, 4, 5])
      return ((index >= 0) && (index <= 4))
    })
  })

  it('should return null on empty array', () => {
    assert.equal(randomIndex([]), null)
  })
})

describe('randomElement', () => {
  it('should generate random element', () => {
    assert50(() => {
      const element = randomElement([1, 2, 3, 4, 5])
      return [1, 2, 3, 4, 5].includes(element)
    })
  })

  it('should return null on empty array', () => {
    assert.equal(randomElement([]), null)
  })

  it('should return null on null', () => {
    assert.equal(randomElement(null), null)
  })
})

describe('randomFloat', () => {
  it('should generate random float', () => {
    assert50(() => {
      const num = randomFloat({ min: 1, max: 3 })
      return ((num >= 1) && (num <= 3))
    })
  })

  it('should accept array argument', () => {
    assert50(() => {
      const num = randomFloat([1, 3])
      return ((num >= 1) && (num <= 3))
    })
  })

  it('should accept integer argument', () => {
    assert50(() => {
      const num = randomFloat(3)
      return ((num >= 0) && (num <= 3))
    })
  })

  it('should accept positional argument', () => {
    assert50(() => {
      const num = randomFloat(4, 10)
      return ((num >= 4) && (num <= 10))
    })
  })
})