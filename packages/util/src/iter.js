import { isObject, isNumber } from './type'

export function times (n) {
  let i = 0
  const results = []
  return function f (fn) {
    while (i < n) {
      results.push(fn(i))
      i++
    }
    return results
  }
}

export function range ({ start = 0, end }) {
  const nums = []
  for (let i = start; i <= end; i++) {
    nums.push(i)
  }
  return nums
}

export function minMaxArgs(...args) {
  const { length } = args

  const error = new Error('Invalid arguments')

  if (length > 2) {
    throw error
  } else if (length === 2) {
    if (!args.every(isNumber)) {
      throw error
    }
    args = [{ min: args[0], max: args[1]}]
  } else if (length === 0) {
    args = [{}]
  }

  // Now we know its an array of length 1
  let arg = args[0]
  if (Array.isArray(arg)) {
    const [min, max] = arg
    arg = { min, max }
  } else if (isNumber(arg)) {
    arg = {
      max: arg
    }
  } else if (!isObject(arg)) {
    throw error
  }

  // Now we know arg is an object
  const { min = 0, max = 1 } = arg
  return { min, max }
}
