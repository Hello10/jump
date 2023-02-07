import assert from 'assert'

export function assert50 (fn, message = null) {
  for (let i = 0; i < 50; i++) {
    const value = fn()
    assert(value, message)
  }
}