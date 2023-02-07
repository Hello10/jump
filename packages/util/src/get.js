import { isNullOrUndefined } from './type'

export function get (object, path, defaultValue = undefined) {
  const parts = (path ?? '').split('.')
  const result = parts.reduce((res, current) => {
    const defined = !isNullOrUndefined(res)
    return defined ? res[current] : res
  }, object)
  return isNullOrUndefined(result) ? defaultValue : result
}

export default get
