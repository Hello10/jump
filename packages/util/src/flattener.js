export function flattener ({ join = '.', into: intoBase } = {}) {
  return function flatten (obj, key = null, into = intoBase || {}) {
    if (obj && (obj.constructor === Object)) {
      const entries = Object.entries(obj)
      if (entries.length) {
        for (const [k, v] of entries) {
          const parts = key ? [key, k] : [k]
          const newKey = parts.join(join)
          flatten(v, newKey, into)
        }
      } else {
        into[key] = {}
      }
    } else {
      into[key] = obj
    }
    return into
  }
}

export default flattener
