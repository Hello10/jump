export function nonempty (value) {
  if ((value === null) || (value === undefined)) {
    return false
  }
  if (value.length !== undefined) {
    return (value.length > 0)
  }
  if (value.constructor === Object) {
    const keys = Object.keys(value)
    return (keys.length > 0)
  }
  return true
}

export default nonempty
