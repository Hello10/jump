import { isObject, isNumber, isNullOrUndefined } from './type'

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

export function range (...args) {
  // TODO: use minMaxArgs ?
  args = args.flat()
  const argsError = new Error('Invalid arguments')
  const len = args.length
  if (len === 1) {
    args = args[0]
    if (isNumber(args)) {
      args = { count: args }
    } else if (!isObject(args)) {
      throw argsError
    }
  } else if (len === 2) {
    args = { min: args[0], max: args[1]}
  } else {
    throw argsError
  }

  let { min = 0, max, count } = args

  if (isNullOrUndefined(max) && count) {
    max = count - 1
  }

  const positive = min <= max
  const inc = positive ? 1 : -1
  const comp = (a, b) => positive ? a <= b : a >= b
  const nums = []
  for (let i = min; comp(i, max); i = i + inc) {
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
  const { min = 0, max = 1, ...more } = arg
  return { min, max, ...more }
}

// TODO: move to numbers.js ?
export function rangeMapper({ input, output }) {
  const { min: outMin, max: outMax } = minMaxArgs(output)
  const { min: inMin, max: inMax } = minMaxArgs(input)

  const outRange = (outMax - outMin)
  const inRange = (inMax - inMin)
  const scale = (outRange / inRange)

  return function mapRange (value) {
    const inOffset = (value - inMin)
    return ((inOffset * scale) + outMin)
  }
}

export function mapRanges (args) {
  const { input, output, value } = args
  return rangeMapper({ input, output })(value)
}