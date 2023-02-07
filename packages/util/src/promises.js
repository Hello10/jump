export async function pmap (iterable, map, options = {}) {
  let concurrency = options.concurrency || Infinity
  let index = 0
  const results = []
  const runs = []
  const iterator = iterable[Symbol.iterator]()
  const sentinel = Symbol('sentinel')

  while (concurrency-- > 0) {
    const r = run()
    if (r === sentinel) {
      break
    } else {
      runs.push(r)
    }
  }

  function run () {
    const { done, value } = iterator.next()
    if (done) {
      return sentinel
    } else {
      const i = index++
      const p = map(value, i)
      return Promise.resolve(p)
        .then((result) => {
          results[i] = result
          return run()
        })
    }
  }

  return Promise.all(runs).then(() => results)
}

export default pmap
