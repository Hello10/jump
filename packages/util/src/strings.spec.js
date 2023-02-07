import assert from 'assert'

import { omitter } from './objects'

import {
  camelCase,
  capitalize,
  constantCase,
  pascalCase,
  pluralize,
  snakeCase,
  splitter,
  words
} from './strings'

describe('capitalize', () => {
  it('should capitalize', () => {
    assert.equal(capitalize('donkey'), 'Donkey')
  })
})

const tests = [
  {
    camel: 'somethingElseWow',
    pascal: 'SomethingElseWow',
    snake: 'something_else_wow',
    constant: 'SOMETHING_ELSE_WOW'
  },
  {
    camel: 'okOkOkOk',
    pascal: 'OkOkOkOk',
    snake: 'ok_ok_ok_ok',
    constant: 'OK_OK_OK_OK'
  }
]

for (const name of Object.keys(tests[0])) {
  describe(`${name}Case`, () => {
    for (const test of tests) {
      const expected = test[name]
      const fn = {
        camel: camelCase,
        pascal: pascalCase,
        snake: snakeCase,
        constant: constantCase
      }[name]
      const others = omitter([name])(test)

      for (const [oname, value] of Object.entries(others)) {
        it(`should return ${name} case for a ${oname} string`, () => {
          const output = fn(value)
          assert(output === expected, `output for ${oname} wrong: ${name}Case(${value}) = ${output} != ${expected}`)
        })
      }
    }
  })
}

describe('words', () => {
  it('should split strings into words based on spaces', () => {
    let output = words('asdfasdf    sdf sdfsf')
    assert.deepEqual(output, ['asdfasdf', 'sdf', 'sdfsf'])

    output = words('abcdef')
    assert.deepEqual(output, ['abcdef'])
  })
})

describe('splitter', () => {
  it('should return function that splits strings', () => {
    const splitOnVowelsAndPunctuation = splitter(/[aeiou]/, /[?.!]/)
    const output = splitOnVowelsAndPunctuation('hi how are you? i am just great thanks')
    const joined = output.join('')
    assert.equal(joined, 'h hw r y  m jst grt thnks')
  })
})

describe('pluralize', () => {
  it('should pluralize words', () => {
    const things = pluralize({ word: 'thing' })
    assert.equal(things, 'things')
  })

  it('should pluralize with count', () => {
    const skies = pluralize({
      word: 'sky',
      plural: 'skies',
      count: 2
    })
    assert.equal(skies, '2 skies')

    const fart = pluralize({
      word: 'fart',
      plural: 'farts',
      count: 1
    })
    assert.equal(fart, 'a fart')
  })

  it('should throw if word not passed', () => {
    assert.throws(() => {
      pluralize({ plural: 2 })
    }, /missing/)
  })
})
