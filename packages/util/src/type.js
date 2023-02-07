export function type (obj) {
  if ((obj === null) || (obj === undefined)) {
    return obj
  } else {
    return obj.constructor
  }
}

export function isBuiltIn (obj) {
  const builtIns = [
    Object,
    Function,
    Array,
    String,
    Boolean,
    Number,
    Date,
    RegExp,
    Error
  ]
  return typeIs(builtIns)(obj)
}

export function isNull(val) {
  return val === null
}

export function isUndefined(val) {
  return val === undefined
}

export function isNullOrUndefined (val) {
  return isNull(val) || isUndefined(val)
}

function typeString (obj) {
  const _toString = ({}).toString

  // [object Blah] -> Blah
  const stype = _toString.call(obj).slice(8, -1)

  if (isNullOrUndefined(obj)) {
    return stype.toLowerCase()
  }

  const ctype = type(obj)
  const useName = (ctype && !isBuiltIn(obj))
  return useName ? ctype.name : stype
}

function typeIs (...types) {
  return function any (obj) {
    return types.flat(100).some((t) => {
      if (type(t) === String) {
        return typeString(obj) === t
      } else {
        return type(obj) === t
      }
    })
  }
}

type.is = typeIs
type.string = typeString
type.isBuiltIn = isBuiltIn

export const isObject = typeIs(Object)
export const isFunction = typeIs(['Function', 'AsyncFunction'])
export const isArray = typeIs(Array)
export const isString = typeIs(String)
export const isBoolean = typeIs(Boolean)
export const isNumber = typeIs(Number)
export const isDate = typeIs(Date)
export const isRegExp = typeIs(RegExp)
export const isError = typeIs(Error)

type.isObject = isObject
type.isFunction = isFunction
type.isArray = isArray
type.isString = isString
type.isBoolean = isBoolean
type.isNumber = isNumber
type.isDate = isDate
type.isRegExp = isRegExp
type.isError = isError

export default type
