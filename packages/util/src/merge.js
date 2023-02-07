import { isObject } from './type'

export function merge (...objects) {
  return objects.reduce((merged, obj) => {
    if (!obj) {
      return merged
    }
    Object.keys(obj).forEach(key => {
      const value = obj[key]
      if (isObject(value)) {
        const existing = merged[key] ?? {}
        merged[key] = merge(existing, value)
      } else {
        merged[key] = value
      }
    })
    return merged
  }, {})
}

export default merge
