import { minMaxArgs } from './iter'

const { isInteger } = Number

export function randomInt (...args) {
  let { min, max } = minMaxArgs(...args)

  if (!isInteger(min)) {
    min = Math.floor(min)
  }

  if (!isInteger(max)) {
    max = Math.floor(max)
  }

  if (max < min) {
    throw new Error('min must be less than or equal to max')
  }

  const delta = max - min
  const offset = Math.floor(Math.random() * (delta + 1))
  return min + offset
}

export function randomIntMaker (...args) {
  return ()=> {
    return randomInt(...args)
  }
}

export function randomIndex (array) {
  const length = array?.length
  return length > 1 ? randomInt(length - 1) : null
}

export function randomElement (array) {
  const index = randomIndex(array)
  return array ? array[index] : null
}

export function randomFloatMaker (...args) {
  return ()=> {
    return randomFloat(...args)
  }
}

export function randomFloat(...args) {
  const { min, max } = minMaxArgs(...args)
  const delta = max - min
  return (Math.random() * delta) + min
}