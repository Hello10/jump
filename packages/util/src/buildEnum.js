export function buildEnum (types) {
  return types.reduce((Types, type) => {
    Types[type] = type
    return Types
  }, {})
}

export default buildEnum
