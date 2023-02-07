import identity from './identity'

export function compose (...fns) {
  fns = fns.flat()
  return (...args) => {
    return fns.reduceRight((res, fn) => {
      return [fn.apply(null, res)]
    }, args)[0]
  }
}

export function iterate (times) {
  return (fn) => {
    const done = times === 0
    return done ? identity : compose(fn, iterate(times - 1)(fn))
  }
}
