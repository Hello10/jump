
import assert from 'assert'

import { getSubdomain, makeGetSubdomainApp } from './domains'

describe('getSubdomains', () => {
  it('gets subdomain from hostname', () => {
    const result = getSubdomain('foo.bar.baz.com')
    assert(result === 'foo.bar')
  })

  it('handles localhost', () => {
    const result = getSubdomain('foo.localhost')
    assert(result === 'foo')
  })

  it('returns empty string when no subdomain', () => {
    let result = getSubdomain('foo.com')
    assert(result === '')

    result = getSubdomain('com')
    assert(result === '')
  })
})

describe('makeGetSubdomainApp', () => {
  const MainApp = 'MainApp'
  const FooApp = 'FooApp'
  const BarApp = 'BarApp'

  const map = [
    {
      subdomains: ['wow', 'www'],
      app: MainApp,
      main: true
    },
    {
      subdomains: ['wow.foo', 'foo'],
      app: FooApp
    },
    {
      subdomains: ['wow.bar', 'bar'],
      app: BarApp
    }
  ]

  it('gets subdomain from hostname', () => {
    const getSubdomainApp = makeGetSubdomainApp(map)
    for (const [input, expects] of Object.entries({
      'barf.com': MainApp,
      'wow.barf.com': MainApp,
      'www.barf.com': MainApp,
      'wow.foo.barf.com': FooApp,
      'foo.barf.com': FooApp,
      'wow.bar.barf.com': BarApp,
      'bar.barf.com': BarApp,
      'derp.barf.com': MainApp
    })) {
      const output = getSubdomainApp(input)
      assert.equal(output, expects)
    }
  })

  it('should throw in no main app', () => {
    assert.throws(() => {
      makeGetSubdomainApp(map.filter((item) => !item.main))
    }, 'Must set')
  })
})
