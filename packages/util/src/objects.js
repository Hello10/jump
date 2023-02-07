import { camelCase } from './strings'

export function makeIterableEntry (entry) {
  const [key, value] = entry
  return {
    key,
    k: key,
    value,
    val: value,
    v: value,
    [Symbol.iterator] () {
      let index = 0
      return {
        next () {
          if (index < entry.length) {
            return { value: entry[index++], done: false }
          } else {
            return { done: true }
          }
        }
      }
    }
  }
}

export function entryReducer (reduce, initial = {}) {
  return function reducer (obj) {
    return Object.entries(obj).reduce((result, entry, ...args) => {
      entry = makeIterableEntry(entry)
      return reduce(result, entry, ...args)
    }, initial)
  }
}

function pickerOmitter (omit) {
  return function filterer (args) {
    let test
    if (Array.isArray(args)) {
      test = ({ key }) => args.includes(key)
    } else {
      test = args
    }
    return function filter (obj) {
      const reducer = entryReducer((result, entry) => {
        let keep = test(entry)
        if (omit) {
          keep = !keep
        }
        return {
          ...result,
          ...(keep ? { [entry.key]: entry.value } : {})
        }
      })
      return reducer(obj)
    }
  }
}

export const picker = pickerOmitter(false)
export const omitter = pickerOmitter(true)

export function mapo ({
  key: mapkey,
  value: mapval
}) {
  return function map (obj) {
    const entries = Object.entries(obj)
    const mapped = entries.map((entry) => {
      let [key, value] = entry
      if (mapkey) {
        key = mapkey(makeIterableEntry(entry))
      }
      if (mapval) {
        value = mapval(makeIterableEntry(entry))
      }
      return [key, value]
    })
    return Object.fromEntries(mapped)
  }
}

export function hasAllKeys (keys) {
  return function hasAll (obj) {
    return keys.every((key) => {
      return Object.prototype.hasOwnProperty.call(obj, key)
    })
  }
}

export function hasExactKeys (keys) {
  const hasAll = hasAllKeys(keys)
  return function hasExact (obj) {
    const numKeys = Object.keys(obj).length
    return (numKeys === keys.length) && hasAll(obj)
  }
}

export const charkeys = mapo({
  key: ({ key }) => key[0]
})

export function hasAllCharkeys (keys) {
  return function has (obj) {
    obj = charkeys(obj)
    return hasAllKeys(keys)(obj)
  }
}

export const camelCaseKeys = mapo({
  key: ({ key }) => camelCase(key)
})

export function toQueryString (obj) {
  return Object.entries(obj).reduce((encoded, entry) => (
    [
      ...encoded,
      entry.map(encodeURIComponent).join('=')
    ]
  ), []).join('&')
}
