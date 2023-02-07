import defined from './defined'

const intervalRegex = /(?<left>[[(])\s*(?<leftNum>[+-]?([0-9]+([.][0-9]*)?|([.][0-9]+)|∞))\s*,\s*(?<rightNum>[+-]?([0-9]+([.][0-9]*)?|([.][0-9]+)|∞))\s*(?<right>[)\]])/

export function interval (arg) {
  if (arg.constructor === String) {
    const match = arg.match(intervalRegex)
    if (!match) {
      throw new Error('Invalid interval string')
    }

    const { left, leftNum, rightNum, right } = match.groups
    const map = {
      '[': 'gte',
      '(': 'gt',
      ')': 'lt',
      ']': 'lte'
    }

    const bounds = [leftNum, rightNum].map((num) => {
      if (num === '-∞') {
        return -Infinity
      } else if (num === '∞') {
        return Infinity
      } else {
        return parseFloat(num)
      }
    })

    arg = {
      [map[left]]: bounds[0],
      [map[right]]: bounds[1]
    }
  }

  if (Array.isArray(arg)) {
    const [gte, lte] = arg
    arg = {
      gte,
      lte
    }
  }

  if ('max' in arg) {
    arg.lte = arg.max
    delete arg.max
  }

  if ('min' in arg) {
    arg.gte = arg.min
    delete arg.min
  }

  const hasGt = defined(arg.gt)
  const hasGte = defined(arg.gte)
  const hasLt = defined(arg.lt)
  const hasLte = defined(arg.lte)

  const hasBothG = (hasGt && hasGte)
  const hasBothL = (hasLt && hasLte)
  const hasOne = (hasGt || hasGte || hasLt || hasLte)

  if (hasBothG || hasBothL || !hasOne) {
    throw new Error('Invalid interval')
  }

  return arg
}

export default interval
