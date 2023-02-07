import type from './type'
import { picker } from './objects'

export function compact (obj) {
  const t = type(obj)
  switch (t) {
    case Array:
      return obj.filter(Boolean)
    case Object: {
      const pick = picker(({ value }) => Boolean(value))
      return pick(obj)
    }
    case String:
      return obj.replace(/\s+/g, '')
    default:
      throw new Error(`compact does not support type ${t}`)
  }
}

export default compact
