import assert from 'assert'

import routePath from './routePath'

describe('routePath', ()=> {
  it('should match simple paths', ()=> {
    const { match, namedParams } = routePath('/derp')
    assert.deepEqual(namedParams, [])

    const matched = match('/derp')
    assert(matched)
    assert.deepEqual(matched, {})
  })

  it('should fail to match paths that do no match', ()=> {
    const { match } = routePath('/derp')
    const matched = match('/dorp')
    assert(!matched)
  })

  it('should match nested paths', ()=> {
    const { match, namedParams } = routePath('/derp/dorp')
    assert.deepEqual(namedParams, [])

    const matched = match('/derp/dorp')
    assert(matched)
    assert.deepEqual(matched, {})
  })

  it('should match optional static paths', ()=> {
    const { match, namedParams, build } = routePath('/derp/dorp?')
    assert.deepEqual(namedParams, [])

    const matched = match('/derp')
    assert(matched)
    assert.deepEqual(matched, {})

    const matched2 = match('/derp/dorp')
    assert(matched2)
    assert.deepEqual(matched2, {})

    const path = build()
    assert.equal(path, '/derp')

    const path2 = build({ derp: 'dorp' })
    assert.equal(path2, '/derp')
  })

  it('should match paths with params', ()=> {
    const { match, namedParams, build } = routePath('/derp/:derp')
    assert.deepEqual(namedParams, [{ name: 'derp', optional: false }])

    const matched = match('/derp/wow')
    assert(matched)
    assert.equal(matched.derp, 'wow')

    const path = build({ derp: 'wow' })
    assert.equal(path, '/derp/wow')
  })

  it('should match paths with optional params', ()=> {
    const { build, match, namedParams } = routePath('/derp/:derp?')
    assert.deepEqual(namedParams, [{ name: 'derp', optional: true }])

    assert.equal(build(), '/derp')
    assert.equal(build({ derp: 'wow' }), '/derp/wow')

    const matched = match('/derp/wow')
    assert(matched)
    assert.equal(matched.derp, 'wow')

    const matched2 = match('/derp')
    assert(matched2)
    assert.equal(matched2.derp, undefined)
  })

  it('should match paths with multiple params', ()=> {
    const { match, namedParams } = routePath('/derp/:derp/foo/:derp2')
    assert.deepEqual(namedParams, [
      {name: 'derp', optional: false },
      { name: 'derp2', optional: false }
    ])

    const matched = match('/derp/wow/foo/derp')
    assert(matched)
    assert.equal(matched.derp, 'wow')
    assert.equal(matched.derp2, 'derp')
  })

  it('should match paths with wildcards', ()=> {
    const rp = routePath('/derp/*')
    assert.deepEqual(rp.namedParams, [])

    const matched = rp.match('/derp/wow/derp')
    assert(matched)
    assert.equal(matched.wildcards[0], 'wow/derp')

    const rp2 = routePath('/derp/*donk')
    assert(rp2.namedParams.length === 1)


    const matched2 = rp2.match('/derp/wow/derp')
    assert(matched2)
    assert.equal(matched2.wildcards, undefined)
    assert.equal(matched2.donk, 'wow/derp')
  })

  it('should handle root path', ()=> {
    const { match, namedParams } = routePath('/')
    assert.deepEqual(namedParams, [])

    const matched = match('/')
    assert(matched)
    assert.deepEqual(matched, {})

    const matched2 = match('/derp')
    assert(!matched2)
  })
})