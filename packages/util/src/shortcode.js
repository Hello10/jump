import { times } from './iter'
import { randomInt } from './random'

// No 'O' or '0'
const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'.split('')

function randomReadableChar () {
  const index = randomInt(chars.length - 1)
  return chars[index]
}

export function shortcode ({ length = 6 } = {}) {
  return times(length)(randomReadableChar).join('')
}

export default shortcode
