import assert from 'assert'

import {
  get,
  omitter,
  merge,
  picker,
  entryReducer,
  entryMapper,
  mapo,
  makeIterableEntry,
  camelCaseKeys,
  charkeys,
  hasAllKeys,
  hasExactKeys,
  hasAllCharkeys,
  toQueryString
} from './objects'

describe('omitter', () => {
  const obj = {
    a: 1,
    b: 2,
    c: 3
  }

  it('should make function that omits keys from array', () => {
    const omit = omitter(['a', 'b'])
    assert.deepEqual(omit(obj), { c: 3 })
  })

  it('should make function omits by test', () => {
    const omit = omitter(([k, v]) => `${k}${v}` === 'b2')
    assert.deepEqual(omit(obj), { a: 1, c: 3 })
  })
})

describe('picker', () => {
  const obj = {
    a: 1,
    b: 2,
    c: 3
  }

  it('should make function that keeps keys from array', () => {
    const pick = picker(['a', 'b'])
    assert.deepEqual(pick(obj), { a: 1, b: 2 })
  })

  it('should make function keeps by test', () => {
    const pick = picker(({ k, v }) => `${k}${v}` === 'b2')
    assert.deepEqual(pick(obj), { b: 2 })
  })
})

describe('entryReducer', () => {
  const suffixKeyIndex = entryReducer((result, { k, v }, index) => {
    return {
      ...result,
      [`${k}${index}`]: v
    }
  })

  const output = suffixKeyIndex({
    doh: 'one',
    duh: 'two'
  })

  assert.deepEqual(output, {
    doh0: 'one',
    duh1: 'two'
  })
})

describe('mapo', () => {
  it('should map objects', () => {
    const upkeys = mapo({
      key: ({ key }) => key.toUpperCase()
    })
    assert.deepEqual(upkeys({ x: 10, yyy: 11 }), { X: 10, YYY: 11 })

    const double = mapo({
      value: ({ value }) => value * 2
    })
    assert.deepEqual(double({ z: 12 }), { z: 24 })

    const doubledouble = mapo({
      key: ({ key }) => `${key}${key}`,
      value: ({ value }) => value * 2
    })
    assert.deepEqual(doubledouble({ z: 12 }), { zz: 24 })
  })
})

describe('makeIterableEntry', () => {
  it('should allow iteration', () => {
    const entry = ['what', 'why']
    const iter = makeIterableEntry(entry)
    const [k, v, ...rest] = iter
    assert(k === entry[0])
    assert(v === entry[1])
    assert(rest.length === 0)
  })

  it('should allow spread', () => {
    const entry = ['what', 'why']
    const iter = makeIterableEntry(entry)
    const { key, k, value, val, v } = iter

    assert(k === entry[0])
    assert(key === entry[0])

    assert(v === entry[1])
    assert(val === entry[1])
    assert(value === entry[1])

    assert(entry[2] === undefined)
  })
})

describe('hasExactKeys', () => {
  it('should check whether has only specified keys', () => {
    const xyz = hasExactKeys(['x', 'y', 'z'])
    assert.equal(xyz({}), false)
    assert.equal(xyz({ x: 10, y: 11 }), false)
    assert.equal(xyz({ w: 10, x: 1, y: 2, z: 3 }), false)
    assert.equal(xyz({ x: 0, y: 2, z: 3 }), true)
  })
})

describe('hasAllKeys', () => {
  it('should check whether all keys exists', () => {
    const xyz = hasAllKeys(['x', 'y', 'z'])
    assert.equal(xyz({}), false)
    assert.equal(xyz({ x: 10, y: 11 }), false)
    assert.equal(xyz({ w: 10, x: 1, y: 2, z: 3 }), true)
  })
})

describe('charkeys', () => {
  it('should flatten obj keys to single char', () => {
    const input = {
      xylophone: 1,
      yams: 2,
      zebra: 3
    }
    const output = charkeys(input)
    assert.deepEqual(output, { x: 1, y: 2, z: 3 })
  })
})

describe('hasAllCharkeys', () => {
  it('should check whether all charkeys exists', () => {
    const hasAbc = hasAllCharkeys(['a', 'b', 'c'])
    const yes = { axe: 1, animal: 2, arp: 3, bug: 4, channel: 5 }
    const no = { car: 10 }
    assert(hasAbc(yes))
    assert(!hasAbc(no))
  })
})

describe('hasAllKeys', () => {
  it('should check whether all keys exists', () => {
    const xyz = hasAllKeys(['x', 'y', 'z'])
    assert.equal(xyz({}), false)
    assert.equal(xyz({ x: 10, y: 11 }), false)
    assert.equal(xyz({ w: 10, x: 1, y: 2, z: 3 }), true)
  })
})

describe('camelCaseKeys', () => {
  it('should convert object keys to camelCase', () => {
    const output = camelCaseKeys({
      ok_wow: 123,
      ok_hey: 456,
      OkWowHowNow: 789
    })
    assert.deepEqual(output, {
      okWow: 123,
      okHey: 456,
      okWowHowNow: 789
    })
  })
})

describe('toQueryString', () => {
  it('should convert object to query string', () => {
    const output = toQueryString({
      a: 1,
      b: 2,
      c: 3
    })
    assert.equal(output, 'a=1&b=2&c=3')
  })
})

describe('get', () => {
  it('should get a nested property from an object', () => {
    const obj = { a: { b: { c: 1 } } }
    assert.equal(get(obj, 'a.b.c'), 1)
  })

  it('should allow for a default value', () => {
    const obj = { a: { b: { c: 1 } } }
    assert.equal(get(obj, 'a.b.d', 2), 2)
  })

  it('should return undefined if the path is not found', () => {
    const obj = { a: { b: { c: 1 } } }
    assert.equal(get(obj, 'a.b.d'), undefined)
  })

  it('should handle null path', () => {
    const obj = { a: { b: { c: 1 } } }
    assert.equal(get(obj, null), undefined)
  })

  it('should handle null value', () => {
    assert.equal(get(null, 'a.b.c'), undefined)
  })
})

describe('merge', () => {
  it('should handle merging basic objects', () => {
    const a = { a: 1 }
    const b = { b: 2 }
    const c = { c: 3 }
    const merged = merge(a, b, c)
    assert.deepEqual(merged, { a: 1, b: 2, c: 3 })
  })

  it('should handle merging nested objects', () => {
    const a = { a: 1 }
    const b = { b: { c: 2 } }
    const c = { b: { d: 3 } }
    const merged = merge(a, b, c)
    assert.deepEqual(merged, { a: 1, b: { c: 2, d: 3 } })
  })

  it('should handle null arguments', () => {
    const a = { a: 1 }
    const b = { b: 2 }
    const c = null
    const merged = merge(a, b, c)
    assert.deepEqual(merged, { a: 1, b: 2 })
  })

  it('should handle overwriting from left to write', () => {
    const a = { a: 1 }
    const b = { a: 2 }
    const c = { a: 3 }
    const merged = merge(a, b, c)
    assert.deepEqual(merged, { a: 3 })
  })
})

