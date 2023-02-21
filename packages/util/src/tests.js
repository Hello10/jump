import assert from 'assert'

export function assertMany ({ times = 10 } = {}) {
  return (fn, message = null ) => {
    for (let i = 0; i < times; i++) {
      const value = fn()
      assert(value, message)
    }
  }
}