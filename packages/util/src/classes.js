export function classes (...args) {
  return args.flat(10).flatMap((add) => {
    const { constructor } = add ?? {}
    if (!add) {
      return null
    } else if (constructor === Boolean) {
      return null
    } else if (constructor === Symbol) {
      return add.toString().slice(7, -1)
    } else if ([Number, String, BigInt].includes(constructor)) {
      return add
    } else if (add.constructor === Function) {
      return add()
    } else {
      return Object.entries(add).map(([k, v]) => {
        if (v?.constructor === Function) {
          v = v()
        }
        return v ? k : null
      })
    }
  }).filter(Boolean).join(' ')
}

function base (...args) {
  const base = classes(...args)
  return (...args) => classes(base, ...args)
}

classes.base = base

export default classes
