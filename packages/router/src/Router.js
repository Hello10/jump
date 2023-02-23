import { omitter, type, isNullOrUndefined } from '@jump/util'

import logger from './logger'
import MatchResult from './MatchResult'
import Route from './Route'
import RouterHistory from './RouterHistory'

const getExtra = omitter(['route', 'url'])

export class Router {
  constructor ({
    routes,
    redirects = {},
    notFound = {},
    maxRedirects = 10,
    onGo = null,
    web = null,
  }) {
    if (isNullOrUndefined(web)) {
      web = this.#supportsWeb()
    }

    if (web && !this.#supportsWeb()) {
      throw new Error('Web is not supported')
    }

    this.web = web
    this.history = new RouterHistory({ web })
    this.maxRedirects = maxRedirects
    this.listeners = []
    if (onGo) {
      this.onGo(onGo)
    }

    // Not found defaults
    let {
      name: notFoundName,
      redirect: notFoundRedirectTest = null,
      ...notFoundRoute
    } = {
      name: 'NotFound',
      path: '/404',
      ...notFound
    }

    if (!notFoundRedirectTest) {
      notFoundRedirectTest = notFoundName in redirects ?
        redirects[notFoundName] :
        (match)=> {
          return match ? false : notFoundName
        }
    }

    // Setup routes
    this.routes = []
    const routeEntries = Object.entries({
      [notFoundName]: {
        ...notFoundRoute,
      },
      ...routes
    })
    for (const [name, config] of routeEntries) {
      const route = new Route({
        ...config,
        name
      })
      this.routes.push(route)
      logger.debug('Added route', route)
    }

    // Setup redirects
    this.redirects = [
      {
        name: notFoundName,
        test: notFoundRedirectTest
      }
    ]
    for (const [name, test] of Object.entries(redirects)) {
      if (name !== notFoundName) {
        this.redirects.push({name, test})
      }
    }

    logger.debug('Constructed router', this)
  }

  start() {
    let initialUrl
    if (this.web) {
      global.window.addEventListener('popstate', (event)=> {
        const match = this.match(event.state)
        this.#notifyOnChange(match)
      })
      const {pathname, search} = global.window.location
      initialUrl = `${pathname}${search}`
    } else {
      initialUrl = '/'
    }

    return this.go({url: initialUrl})
  }

  getRoute (query) {
    return this.routes.find((route)=> {
      return Object.entries(query).every(([k, v])=> {
        return (route[k] === v)
      })
    })
  }

  getRouteByName (name) {
    return this.getRoute({ name })
  }

  get current () {
    return this.history.current
  }

  // match
  // -----
  // Checks whether there is a route matching the input.
  match (input) {
    input = this.normalizeInput(input)
    const extra = getExtra(input)
    const original = this.#doMatch(input)
    const redirect = this.#checkRedirects({original, extra})

    logger.debug('match', {input, original, redirect})

    if (redirect) {
      redirect.isRedirect({original})
      return redirect
    } else {
      return original
    }
  }

  normalizeInput (input) {
    switch (type(input)) {
      case String: {
        if (input.indexOf('/') !== -1) {
          return { url: input }
        } else {
          return { route: {name: input} }
        }
      }
      case Object: {
        if (input.name) {
          return { route: input }
        } else {
          return input
        }
      }
      default: {
        const error = new Error('Invalid input')
        error.input = input
        throw error
      }
    }
  }

  onGo (listener) {
    this.listeners.push(listener)
  }

  go (input) {
    const match = this.match(input)
    this.history.push(match.url)
    this.#notifyOnChange(match)
    return match
  }

  back () {
    const previous = this.history.back()
    const match = this.match(previous)
    this.#notifyOnChange(match)
    return match
  }

  forward () {
    const next = this.history.forward()
    const match = this.match(next)
    this.#notifyOnChange(match)
    return match
  }

  #doMatch (input) {
    logger.debug('Attempting to match route', input)

    // If passed full url, treat it as redirect
    const {url} = input
    if (url && url.match(/^https?:\/\//)) {
      return new MatchResult({
        redirect: true,
        input,
        url
      })
    }

    // Find a match for the input
    let match = null
    for (const r of this.routes) {
      match = r.match(input)
      if (match) {
        break
      }
    }

    return match
  }

  #checkRedirects ({
    original,
    extra,
    previous = null,
    current = null,
    numRedirects = 0,
    history = []
  }) {
    logger.debug('Checking redirects', {original, extra, previous, current, numRedirects, history})
    const {maxRedirects} = this
    if (numRedirects >= maxRedirects) {
      const msg = `Number of redirects exceeded maxRedirects (${maxRedirects})`
      logger.error(msg)
      throw new Error(msg)
    }

    function deepEqual (a, b) {
      const {stringify} = JSON
      return (stringify(a) === stringify(b))
    }

    // if current is the same as original, then we've looped, so this shouldn't
    // be a redirect
    // TODO: improve cycle detection
    if (current && previous) {
      const sameRoute = (current.route === previous.route)
      const sameParams = deepEqual(current.params, previous.params)
      if (sameRoute && sameParams) {
        logger.debug('Route is same as previous', {current, previous})
        return previous
      }
    }

    if (!current) {
      current = original
      history = [original]
    }

    if (current.redirect) {
      return current
    }

    let next = false
    if (current && current.route.redirect) {
      next = current.route.redirect(current)
    }

    if (!next) {
      for (const {test} of this.redirects) {
        // test returns false if no redirect is needed
        next = test(current)
        if (next) {
          break
        }
      }
    }

    if (next) {
      logger.debug('Got redirect', {current, next})
      // we got a redirect
      previous = current
      next = this.normalizeInput(next)
      current = this.#doMatch({...next, ...extra})
      if (!current) {
        const error = new Error('No match for redirect result')
        error.redirect = next
        throw error
      }
      history.push(current)
      numRedirects++
      return this.#checkRedirects({original, previous, current, numRedirects, history, extra})
    } else if (numRedirects > 0) {
      return current
    } else {
      return false
    }
  }

  #notifyOnChange(match) {
    for (const listener of this.listeners) {
      listener(match)
    }
  }

  #supportsWeb () {
    const hasLocation = Boolean(global.window?.location)
    const hasHistory = Boolean(global.window?.history)
    return hasLocation && hasHistory
  }
}

export default Router