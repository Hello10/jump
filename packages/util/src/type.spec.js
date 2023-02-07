import assert from 'assert'

import type, { isFunction } from './type'

describe('type', () => {
  class Person {
    constructor (name) {
      this.name = name
    }
  }

  function Person2 (name) {
    this.name = name
  }
  Person2.prototype.barf = function () {
    return this.name + ' just barfed!'
  }

  it('should determine correct constructor and string types', () => {
    const expectations = [
      [
        ['hi', 'there', '1234'],
        [String, 'String']
      ],
      [
        [{}, { one: 1, two: 2 }],
        [Object, 'Object']
      ],
      [
        [[], [1, 2, 3], ['string', 2, false]],
        [Array, 'Array']
      ],
      [
        [null],
        [null, 'null']
      ],
      [
        [1, 20324, 2342.425],
        [Number, 'Number']
      ],
      [
        [true, false],
        [Boolean, 'Boolean']
      ],
      [
        [{}.toString, function () { return 1 + 2 }],
        [Function, 'Function']
      ],
      [
        [new Date()],
        [Date, 'Date']
      ],
      [
        [new Error('oh no'), (function () { try { throw new Error('blah') } catch (e) { return e } })()],
        [Error, 'Error']
      ],
      [
        [/foo|bar/, /.*abc/],
        [RegExp, 'RegExp']
      ],
      [
        [undefined],
        [undefined, 'undefined']
      ],
      [
        [new Person('ralph'), new Person('joe')],
        [Person, 'Person']
      ],
      [
        [new Person2('ralph'), new Person2('joe')],
        [Person2, 'Person2']
      ]
    ]

    for (const [inputs, expected] of expectations) {
      const [constructor, string] = expected
      for (const input of inputs) {
        const ctype = type(input)
        assert(ctype === constructor)

        const stype = type.string(input)
        assert(stype === string, `${stype} != ${string}`)
      }
    }
  })

  describe('.isBuiltIn', () => {
    it('should return true for built in types', () => {
      assert(type.isBuiltIn([]))
      assert(type.isBuiltIn('foo'))
      assert(type.isBuiltIn(123))
    })
    it('should return false for non built in objects', () => {
      const derp = new Person('derp')
      assert(!type.isBuiltIn(derp))

      const dorp = new Person2('dorp')
      assert(!type.isBuiltIn(dorp))
    })
  })

  describe('.is', () => {
    it('should handle checking for one of several types', () => {
      const isString = type.is(String)
      assert(isString('foo'))
      assert(!isString(1234))

      const isDerp = type.is(String, Boolean, 'Number')
      assert(isDerp(true))
      assert(isDerp('derp'))
      assert(isDerp(123))
      assert(!isDerp(null))

      const isDorp = type.is([String, Boolean])
      assert(isDorp(true))
      assert(!isDorp(123))
    })
  })

  describe('isFunction', () => {
    it('should test true for functions', () => {
      const passes = [
        function derp1 () { return 'derp' },
        () => {},
        async function derp2 () { return 'derp2' },
        async () => {}
      ]
      for (const pass of passes) {
        const isFn = isFunction(pass)
        assert.equal(isFn, true, pass)
      }
    })

    it('should test false for non functions', () => {
      const fails = [
        false,
        null,
        undefined,
        10,
        new (class Derp {})(),
        'what'
      ]

      for (const fail of fails) {
        const isFn = isFunction(fail)
        assert.equal(isFn, false, fail)
      }
    })
  })
})
