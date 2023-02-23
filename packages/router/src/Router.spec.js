import assert from 'assert'
import Url from 'url'

import { Router } from './Router'

const routes = {
  Home: {
    path: '/',
    session: true
  },
  NoParams: {
    path: '/show'
  },
  OneParam: {
    path: '/show/:title'
  },
  TwoParam: {
    path: '/show/:foo/barf/:barf'
  },
  OptionalParam: {
    path: '/optional/:optional?'
  },
  Signin: {
    path: '/signin',
    session: false
  },
  Dashboard: {
    path: '/dashboard',
    session: true
  },
  AdminDerp: {
    path: '/admin/derp',
    role: 'admin'
  },
  Multi1: {
    path: '/multi1'
  },
  Multi2: {
    path: '/multi2'
  },
  Multi3: {
    path: '/multi3'
  },
  Self: {
    path: '/self'
  },
  HasRedirect: {
    path: '/redirect/:derp',
    redirect ({params}) {
      return (params.derp === 'randyquaid') ? false : 'Home'
    }
  },
  InputRedirect: {
    path: '/inputredirect',
    redirect ({input}) {
      return input.homer ? 'InputRedirect2' : false
    }
  },
  InputRedirect2: {
    path: '/inputredirect2',
    redirect ({input}) {
      return input.homer ? 'Home' : false
    }
  },
  Endless: {
    path: '/endless/:count?',
    redirect ({params}) {
      const {count = 0} = params
      return `/endless/${count + 1}`
    }
  },
  BadRedirect: {
    path: '/badredirect',
    redirect () {
      return '/thisdoesnotexistok'
    }
  }
}

describe('Router', ()=> {
  let router
  let signedIn
  let role

  const session = {
    signedIn: ()=> {
      return signedIn
    },
    hasRole: (r)=> {
      return (r === role)
    }
  }

  beforeEach(()=> {
    signedIn = true
    role = null

    router = new Router({
      routes,
      onGo: ()=> {},
      redirects: {
        Session: ({route})=> {
          const hasSession = (route.session !== undefined)
          const requireSession = (hasSession && route.session)
          const requireNoSession = (hasSession && !route.session)
          const signedIn = session.signedIn()
          if (requireSession && !signedIn) {
            return 'Signin'
          }
          if (requireNoSession && signedIn) {
            return 'Home'
          }
          return false
        },
        Role: ({route})=> {
          const {role} = route
          const shouldRedirect = (role && !session.hasRole(role))
          return shouldRedirect ? 'Home' : false
        },
        Multi: ({route})=> {
          // force multiple weird redirects
          const isMulti = /Multi/
          const {name} = route
          if (!name.match(isMulti)) {
            return false
          }
          let num = parseInt(name.replace(isMulti, ''), 10)
          if (num < 3) {
            num++
            return `Multi${num}`
          } else {
            return false
          }
        },
        Self: ({route})=> {
          if (route.name === 'Self') {
            return 'Self'
          } else {
            return false
          }
        }
      }
    })

    router.start()
  })

  describe('.getRouteByName', ()=> {
    it('should get a route by name', ()=> {
      const name = 'TwoParam'
      const route = router.getRouteByName(name)
      assert.equal(route.name, name)
    })

    it('should return null when not fond', ()=> {
      const route = router.getRouteByName('MissingAndPresumedScared')
      assert(!route)
    })
  })

  describe('.match', ()=> {
    it('should throw on bad input format', ()=> {
      assert.throws(()=> {
        router.match(10)
      }, /Invalid input/)
    })

    it('should handle missing route', ()=> {
      const match = router.match({
        route: {
          name: 'barf',
          params: {}
        }
      })
      assert(match.redirect)
      assert.equal(match.url, '/404')
    })

    it('should handle missing param', ()=> {
      const match = router.match({
        route: {
          name: 'OneParam',
          params: {
            barf: 'barf'
          }
        }
      })
      assert(match.redirect)
      assert.equal(match.url, '/404')
    })

    it('should handle empty route', ()=> {
      const match = router.match({
        route: {
          name: 'Home',
          params: {}
        }
      })
      assert(match.route)
      assert(!match.redirect)
      assert.equal(match.route.name, 'Home')
      assert.equal(match.url, '/')
    })

    it('should handle matched path route', ()=> {
      const original = '/show/derp'
      const match = router.match({
        url: original
      })
      assert(match.route)
      assert(!match.redirect)
      assert.equal(match.route.name, 'OneParam')
      assert.equal(match.url, original)
    })

    it('should handle no param route', ()=> {
      const match = router.match({
        route: {
          name: 'NoParams',
          params: {}
        }
      })
      assert(match.route)
      assert(!match.redirect)
      assert.equal(match.route.name, 'NoParams')
      assert.equal(match.url, '/show')
    })

    it('should handle one param route', ()=> {
      const match = router.match({
        route: {
          name: 'OneParam',
          params: {
            title: 'barf'
          }
        }
      })

      assert(match.route)
      assert(!match.redirect)
      assert.equal(match.route.name, 'OneParam')
      assert.equal(match.url, '/show/barf')
    })

    it('should handle optional params', ()=> {
      let match = router.match('/optional')
      assert(match.route)
      assert(!match.params.optional)
      assert.equal(match.url, '/optional')

      match = router.match({
        route: {
          name: 'OptionalParam'
        }
      })
      assert(match.route)
      assert(!match.params.optional)
      assert.equal(match.url, '/optional')

      match = router.match('/optional/barf')
      assert(match.route)
      assert(!match.redirect)
      assert.equal(match.url, '/optional/barf')
      assert.equal(match.params.optional, 'barf')
    })

    it('should handle extra params by adding them to the query', ()=> {
      const match = router.match({
        route: {
          name: 'TwoParam',
          params: {
            foo: 'd',
            barf: 'b',
            donk: 'ed',
            honk: 'y'
          }
        }
      })

      assert(match.route)
      assert(!match.redirect)
      const parsed = Url.parse(match.url, true)
      assert.equal(parsed.pathname, '/show/d/barf/b')
      assert.deepEqual(parsed.query, {
        donk: 'ed',
        honk: 'y'
      })
    })

    it('should handle extra query params by keeping them in the query', ()=> {
      const show = '/show?derp=true'
      let match = router.match({
        url: show
      })

      assert(match.route)
      assert(!match.redirect)
      assert.equal(match.url, show)

      const showBarf = '/show/honk?barf=pizza&derp=true&honk=10'
      match = router.match({
        url: showBarf
      })

      assert(match.route)
      assert.equal(match.url, showBarf)
    })

    it('should handle repeated query params', ()=> {
      const showOneDerp = '/show?derp=1'
      const oneMatch = router.match({
        url: showOneDerp
      })

      assert(oneMatch.route)
      assert(!oneMatch.redirect)
      assert.equal(oneMatch.params.derp, 1)
      assert.equal(oneMatch.url, showOneDerp)

      const showMultiDerp = '/show?derp=1&derp=2'
      const multiMatch = router.match({
        url: showMultiDerp
      })

      assert(multiMatch.route)
      assert(!multiMatch.redirect)
      assert.deepEqual(multiMatch.params.derp, [1, 2])
      assert.equal(multiMatch.url, showMultiDerp)

      const tripleDerp = '/show?derp=1&derp=2&derp=3'
      const tripleMatch = router.match({
        url: tripleDerp
      })

      assert(tripleMatch.route)
      assert(!tripleMatch.redirect)
      assert.deepEqual(tripleMatch.params.derp, [1, 2, 3])
      assert.equal(tripleMatch.url, tripleDerp)
    })

    it('should handle redirecting when session is required', ()=> {
      signedIn = false
      const match = router.match({
        url: '/dashboard'
      })
      assert(match.route)
      assert(match.redirect)
      assert.equal(match.url, '/signin')
    })

    it('should handle redirecting when no session is required', ()=> {
      signedIn = true
      const match = router.match({
        url: '/signin'
      })
      assert(match.route)
      assert(match.redirect)
      assert.equal(match.url, '/')
    })

    it('should throw on endless redirect loop', ()=> {
      assert.throws(()=> {
        router.match('/endless')
      }, /Number of redirects exceeded/)
    })

    it('should handle bad redirect', ()=> {
      assert.throws(()=> {
        router.match('/badredirect')
      }, /No match for redirect result/)
    })

    it('should handle custom redirects and no session', ()=> {
      signedIn = false
      role = null
      const match = router.match({
        url: '/admin/derp'
      })
      assert(match.route)
      assert(match.redirect)
      assert.equal(match.url, '/signin')
    })

    it('should handle custom redirects when no redirect needed', ()=> {
      signedIn = true
      role = 'admin'
      const derp = '/admin/derp'
      const match = router.match({
        url: derp
      })
      assert(match.route)
      assert(!match.redirect)
      assert.equal(match.url, derp)
    })

    it('should handle custom redirects when redirect needed', ()=> {
      signedIn = true
      role = 'user'
      const match = router.match({
        url: '/admin/derp'
      })
      assert(match.route)
      assert(match.redirect)
      assert.equal(match.url, '/')
    })

    it('should handle multiple redirects', ()=> {
      const url = '/multi1'
      const match = router.match({url})
      assert(match.redirect)
      assert.equal(match.url, '/multi3')
    })

    it('should not redirect to self indefinitely', ()=> {
      const url = '/self'
      const match = router.match({url})
      assert(match.redirect)
      assert(match.url === url)
    })

    it('should handle string arg as url', ()=> {
      const match = router.match('/')
      assert(match.route)
      assert(!match.redirect)
      assert.equal(match.route.name, 'Home')
      assert.equal(match.url, '/')
    })

    it('should handle string arg as absolute url', ()=> {
      const wonky = 'http://wonky.gov'
      const match = router.match(wonky)
      assert(match.redirect)
      assert.equal(match.route, null)
      assert.equal(match.url, wonky)
    })

    it('should handle string arg as route name', ()=> {
      const match = router.match('Home')
      assert(match.route)
      assert(!match.redirect)
      assert.equal(match.route.name, 'Home')
      assert.equal(match.url, '/')
    })

    it('should handle object arg with name property as route', ()=> {
      const match = router.match({name: 'Home'})
      assert(match.route)
      assert(!match.redirect)
      assert.equal(match.route.name, 'Home')
      assert.equal(match.url, '/')
    })

    it('should handle redirect defined within route', ()=> {
      let url = '/redirect/randyquaid'
      let match = router.match(url)
      assert(match.route)
      assert(!match.redirect)

      url = '/redirect/dennisquaid'
      match = router.match(url)
      assert(match.redirect)
      assert.equal(match.url, '/')
    })

    it('should handle input redirect check', ()=> {
      const url = '/inputredirect'
      let match = router.match({url})
      assert(match.route)
      assert.equal(match.route.name, 'InputRedirect')
      assert(!match.redirect)
      assert.equal(match.url, url)

      const homer = 'Simpson'
      match = router.match({url, homer})
      assert(match.route)
      assert.equal(match.route.name, 'Home')
      assert(match.redirect)
      assert.equal(match.original.input.homer, homer)
    })
  })

  describe('.go', ()=> {
    let went
    let match

    beforeEach(()=> {
      went = false
      match = null
      router.onGo((m)=> {
        went = true
        match = m
      })
    })

    it('should handle calling listeners when route changes', ()=> {
      const showderp = '/show/derp'
      router.go({url: showderp})
      assert(went)
      assert.equal(match.url, showderp)
    })

    it('should handle missing route', ()=> {
      router.go({url: '/derp/derp'})
      assert(went)
      assert(match.redirect)
      assert.equal(match.url, '/404')
    })

    it('should handle redirect', ()=> {
      signedIn = false
      router.go({url: '/dashboard'})
      assert(match.redirect)
      assert.equal(match.url, '/signin')
    })

    it('should handle url', ()=> {
      const quaid = 'https://quaid.gov'
      router.go({url: quaid})
      assert(went)
      assert.equal(match.url, quaid)
    })
  })

  describe('not found configuration', ()=> {
    beforeEach(()=> {
      router = new Router({
        routes: {
          Home: {
            path: '/',
            session: true
          }
        },
        notFound: {
          name: 'Nofoundo',
          path: '/nope',
          redirect: (match)=> {
            return match ? false : '/nope'
          }
        },
      })
    })

    it('should handle matched route', ()=> {
      const url = '/'
      const match = router.match({url})
      assert(match?.route)
      assert.equal(match.route.name, 'Home')
    })

    it('should handle unmatched route', ()=> {
      const url = '/barf'
      const match = router.match({url})
      assert.equal(match.route.name, 'Nofoundo')
    })
  })

  describe('.web', ()=> {
    it('should detect whether it is being used on web', ()=> {
      delete global?.window?.location
      delete global?.window?.history

      router = new Router({
        routes: {},
      })

      assert.equal(router.web, false)

      assert.throws(()=> {
        router = new Router({
          routes: {},
          web: true
        })
      })

      global.window = {
        location: {
          pathname: '/foo',
          search: '?bar=baz'
        },
        history: {
          pushState: jest.fn(),
          replaceState: jest.fn(),
          go: jest.fn()
        },
        addEventListener: jest.fn()
      }

      router = new Router({
        routes: {}
      })
      router.start()

      expect(router.web).toEqual(true)
      expect(global.window.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function))
    })
  })
})