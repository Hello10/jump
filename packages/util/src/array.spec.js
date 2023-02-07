import assert from 'assert'

import array from './array'

describe('array', () => {
  const a = array(10, 11, 12, 13, 14)

  function strCompare (a, b) {
    return a.toString() === b.toString()
  }

  it('should convert stuff to be array', () => {
    const it = array('it')
    assert(it.equals(['it']))

    const noop = array(['x', 'y', 'z'])
    assert(noop.equals(['x', 'y', 'z']))

    const something10 = array('something', 10)
    assert(something10.equals(['something', 10]))

    assert(array(it).equals(['it']))
  })

  it('should return empty array for null and undefined', () => {
    const empty = []
    assert(array().equals(empty))
    assert(array(null).equals(empty))
    assert(array(undefined).equals(empty))
  })

  it('should allow for custom compare', () => {
    const a = array([1, 2, 3, 4, '5', '6'])
    a.compare = strCompare
    const a5 = a.insert({ element: 5, right: 5.5 })
    assert(a5.equals([1, 2, 3, 4, 5, 5.5, 6]))
  })

  it('should handle chaining', () => {
    assert.equal(a.split(1)[1].rest.first, 13)
  })

  it('should still be an array', () => {
    assert(Array.isArray(array(1, 2, 3)))
  })

  it('should support .add', () => {
    assert(array('a', 'b').add('c').equals(['a', 'b', 'c']))
  })

  it('should support .contains', () => {
    assert(array(['a', 'b']).contains('b'))
    const d3rp = array(['d', '3', 'r', 'p'])
    d3rp.compare = strCompare
    assert(d3rp.contains(3))
  })

  it('should support .diffTo and .diffFrom', () => {
    const a = { a: 1 }
    const b = { b: 2 }
    const c = { c: 3 }
    const d = { d: 4 }
    const e = { e: 5 }
    const f = { f: 6 }

    const abcde = array([a, b, c, d, e])
    const abde = abcde.remove(c)
    const abdef = abde.add(f)

    let delta = abcde.diffTo(abdef)
    assert(delta.add.equals([f]))
    assert(delta.remove.equals([c]))

    delta = abcde.diffFrom(abdef)
    assert(delta.add.equals([c]), delta.added)
    assert(delta.remove.equals([f]), delta.removed)

    const nums = array([1, 2, '3', '4', 5])
    nums.compare = strCompare
    const numnums = nums
      .remove({ element: 3 })
      .remove({ element: 5 })
      .add('10')

    delta = nums.diffTo(numnums)
    assert(delta.add.equals([10]))
    assert(delta.remove.equals([3, 5]))

    delta = nums.diffFrom(numnums)
    assert(delta.add.equals([3, 5]))
    assert(delta.remove.equals([10]))
  })

  it('should support .empty', () => {
    assert(!a.empty)
    assert(array(null).empty)
  })

  it('should support .equals', () => {
    assert(array('a', 'b', 'c').equals(['a', 'b', 'c']))
  })

  it('should support .first', () => {
    assert.equal(a.first, 10)
    assert.equal(array([]).first, undefined)
  })

  it('should support .index', () => {
    const d3rp = array(['d', '3', 'r', 'p'])
    d3rp.compare = strCompare
    assert.equal(d3rp.index(3), 1)
    assert.equal(d3rp.index(10), -1)
  })

  it('should support .insert', () => {
    const abcde = array(['a', 'b', 'c', 'd', 'e'])

    const zabcde = abcde.insert({ index: 0, left: 'z' })
    assert(zabcde.equals(['z', 'a', 'b', 'c', 'd', 'e']))

    const mbcde = abcde.insert({ element: 'a', replace: 'm' })
    assert(mbcde.equals(['m', 'b', 'c', 'd', 'e']))

    const abccde = abcde.insert({ index: 2, right: 'c' })
    assert(abccde.equals(['a', 'b', 'c', 'c', 'd', 'e']))

    const abbcdde = abcde.insert({ index: 2, left: 'b', right: 'd' })
    assert(abbcdde.equals(['a', 'b', 'b', 'c', 'd', 'd', 'e']))
  })

  it('should support .last', () => {
    assert.equal(a.last, 14)
    assert.equal(array([]).last, undefined)
  })

  it('should support .remove', () => {
    const no12 = a.remove(2)
    assert(no12.equals([10, 11, 13, 14]))
    const no13 = a.remove({ element: 13 })
    assert(no13.equals([10, 11, 12, 14]))
  })

  it('should support .replace', () => {
    const abc = array(['a', 'b', 'c'])
    const abe = abc.replace({ element: 'c', by: 'e' })
    assert(abe.equals(['a', 'b', 'e']))
    const bbc = abc.replace({ index: 0, by: 'b' })
    assert(bbc.equals(['b', 'b', 'c']))
  })

  it('should support .rest', () => {
    assert(a.rest.equals([11, 12, 13, 14]))
    assert(array().rest.equals([]))
  })

  it('should support .sameSet', () => {
    const reordered = [10, 11, 13, 14, 12]
    assert(a.sameSet(reordered))
    assert(a.sameSet(a))
    assert(!a.sameSet([10, 11, 12, 13]))
  })

  it('should support .split', () => {
    let result = a.split(2)
    assert.deepEqual(result, [[10, 11], [13, 14]])
    result = a.split({ element: 13 })
    assert.deepEqual(result, [[10, 11, 12], [14]])
  })

  it('should support .splitCenter', () => {
    let result = a.splitCenter(2)
    assert.deepEqual(result, [[10, 11], 12, [13, 14]])
    result = a.splitCenter({ element: 13 })
    assert.deepEqual(result, [[10, 11, 12], 13, [14]])
  })

  it('should support .splitLeft', () => {
    let result = a.splitLeft(2)
    assert.deepEqual(result, [[10, 11, 12], [13, 14]])
    result = a.splitLeft({ element: 13 })
    assert.deepEqual(result, [[10, 11, 12, 13], [14]])
  })

  it('should support .splitRight', () => {
    let result = a.splitRight(2)
    assert.deepEqual(result, [[10, 11], [12, 13, 14]])
    result = a.splitRight({ element: 13 })
    assert.deepEqual(result, [[10, 11, 12], [13, 14]])
  })

  it('should support .toggle', () => {
    const xyz = array('x', 'y', 'z')
    const yz = xyz.toggle('x')
    const xyz2 = yz.toggle('x')
    assert(yz.equals(['y', 'z']))
    assert(xyz.sameSet(xyz2))
  })

  it('should support .unwrap', () => {
    let xyz = array('x', 'y', 'z')
    assert(xyz.insert !== undefined)
    xyz = xyz.unwrap()
    assert(xyz.insert === undefined)
  })
})
