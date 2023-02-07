export function rounder ({ decimals = 0, op = Math.round } = {}) {
  if (!(Number.isInteger(decimals) && (decimals >= 0))) {
    throw new Error('Argument decimals must be non-negative integer')
  }

  if (!(op && (op.constructor === Function))) {
    throw new Error('Argument op must be a function')
  }

  const multiplier = 10 ** decimals
  return function round (num) {
    return op(num * multiplier) / multiplier
  }
}

export default rounder
