// TODO: cross ref these with when moving @hello10/color into @jump/color

import { range } from './iter'
import { randomInt } from './random'

export function randomColor () {
  return range(3).map(() => randomInt(255))
}

export function rgb (values) {
  const [r, g, b] = values
  return `rgb(${r},${g},${b})`
}

export function complementColor (color) {
  return color.map((c) => {
    return (255 - c)
  })
}

export function randomColorAndComplement () {
  const color = randomColor()
  return [color, complementColor(color)]
}

export function isValidRgbComponent(value) {
  return ((value >= 0) && (value <= 255))
}

export function isValidRgbArray(values) {
  return values.every(isValidRgbComponent)
}