import assert from 'assert'

import {
  randomColor,
  rgb,
  isValidRgbComponent,
  isValidRgbArray,
  complementColor,
  randomColorAndComplement
} from './color'

describe('randomColor', () => {
  it('should generate random color', () => {
    const color = randomColor()
    assert(isValidRgbArray(color))
  })
})

describe('rgb', () => {
  it('should generate rgb string', () => {
    const str = rgb([1, 2, 3])
    assert.equal(str, 'rgb(1,2,3)')
  })
})

describe('complementColor', () => {
  it('should generate complement color', () => {
    const comp = complementColor([1, 2, 3])
    assert.deepEqual(comp, [254, 253, 252])
    assert(isValidRgbArray(comp))
  })
})

describe('randomColorAndComplement', () => {
  it('should generate random color and complement', () => {
    const [color, complement] = randomColorAndComplement()
    assert(color.every((c, index) => {
      const cc = complement[index]
      const sums = (c + cc === 255)
      const areValid = isValidRgbComponent(c) && isValidRgbComponent(cc)
      return sums && areValid
    }))
  })
})
