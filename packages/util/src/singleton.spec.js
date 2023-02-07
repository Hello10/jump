import assert from 'assert'

import singleton from './singleton'

describe('singleton', () => {
  it('should throw on bad input', () => {
    assert.throws(() => {
      singleton({})
    })
  })

  it('should make a class a singleton', () => {
    class Derp {
      constructor () {
        this.id = Math.floor(Math.random() * 1000)
      }
    }
    singleton(Derp)

    const one = Derp.instance()
    const two = Derp.instance()

    assert.equal(one.id, two.id)
  })

  it('should handle a class hierarchy', () => {
    let id = 1
    class Base {
      constructor (options) {
        this.options = options
        this.id = id
        id++
      }

      get hi () {
        return `${this.constructor.name}=${this.id}`
      }
    }
    singleton({ Class: Base, instance: 'get' })

    class Foo extends Base {}
    class Bar extends Base {}
    class Pom extends Base {}

    const f1 = Foo.get()
    const f2 = Foo.get()
    const b1 = Bar.get()
    const b2 = Bar.get()
    const b3 = Bar.get()
    const p1 = Pom.get()
    const p2 = Pom.get()
    const b4 = Bar.get()
    const f3 = Foo.get()
    const p3 = Pom.get()

    function assertHi (refs, expected) {
      const hello = refs.map((ref) => ref.hi).join(',')
      assert.equal(
        hello,
        expected
      )
    }

    assertHi(
      [f1, f2, b1, b2, b3, p1, p2, b4, f3, p3],
      'Foo=1,Foo=1,Bar=2,Bar=2,Bar=2,Pom=3,Pom=3,Bar=2,Foo=1,Pom=3'
    )

    class Mid extends Base {}
    class X extends Mid {}
    class Y extends Mid {}
    class Z extends Mid {}

    const x1 = X.get()
    const x2 = X.get()
    const y1 = Y.get()
    const y2 = Y.get()
    const z1 = Z.get()
    const z2 = Z.get()

    assertHi(
      [x1, x2, y1, y2, z1, z2],
      'X=4,X=4,Y=5,Y=5,Z=6,Z=6'
    )
  })
})
