import assert from 'assert'

import c from './classes'

describe('classes', () => {
  it('should work for the simple case of one class string', () => {
    const classes = c('Honk')
    assert(classes === 'Honk')
  })

  it('should work for passing object', () => {
    const classes = c({
      Funk: true,
      Dirk: 1 > 0,
      No: null,
      Nope: undefined,
      Narp: () => {
        return false
      },
      'Derp?!': () => {
        return true
      }
    })
    assert(classes === 'Funk Dirk Derp?!')
  })

  it('should return empty string when object with no true values', () => {
    const classes = c({
      wow: false
    })
    assert(classes === '')
  })

  it('should work for passing an array', () => {
    const classes = c(['Ok', 'Wow'])
    assert(classes === 'Ok Wow')
  })

  it('should handle just an object', () => {
    const classes = c({
      Yep: true,
      Nope: false,
      Uhuh: 1 > 0
    })
    assert(classes === 'Yep Uhuh')
  })

  it('should filter falsy values from array', () => {
    const classes = c([
      'Foo',
      false,
      'Bar'
    ])
    assert(classes === 'Foo Bar')
  })

  it('should filter falsy values from array', () => {
    const classes = c([
      'Foo',
      false,
      'Bar'
    ])
    assert(classes === 'Foo Bar')
  })

  it('should allow passing array directly as multiple arguments', () => {
    const classes = c(
      'Foo',
      false,
      'Bar',
      () => 'funkdunk',
      {
        barf: true,
        narf: false
      }
    )
    assert(classes === 'Foo Bar funkdunk barf')
  })

  it('should handle booleans', () => {
    const classes = c(true, 'a', false, true, 10)
    assert(classes === 'a 10')
  })

  it('should handle symbols', () => {
    const classes = c(Symbol('a'), Symbol('bcd'))
    assert.equal(classes, 'a bcd')
  })

  it('withClasses should create a function that adds set of classes', () => {
    const ow = c.base('wow', () => 'now', { dow: true, no: false })
    const classes = ow(['how', 'mow', { nope: false }])
    assert.equal(classes, 'wow now dow how mow')
  })

  it('should handle examples `classnames` npm package', () => {
    const expectations = [
      [
        ['a', ['b', { c: true, d: false }]],
        'a b c'
      ],
      [
        ['foo', 'bar'],
        'foo bar'
      ],
      [
        ['foo', { bar: true }],
        'foo bar'
      ],
      [
        [{ 'foo-bar': true }],
        'foo-bar'
      ],
      [
        [{ 'foo-bar': false }],
        ''
      ],
      [
        [{ foo: true }, { bar: true }],
        'foo bar'
      ],
      [
        [{ foo: true, bar: true }],
        'foo bar'
      ],
      [
        ['foo', { bar: true, duck: false }, 'baz', { quux: true }],
        'foo bar baz quux'
      ],
      [
        [null, false, 'bar', undefined, 0, 1, { baz: null }, ''],
        'bar 1'
      ]
    ]
    for (const [input, expectation] of expectations) {
      const output = c(input)
      assert.equal(output, expectation)
    }
  })
})
