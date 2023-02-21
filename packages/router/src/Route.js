import { parseUrlOrPath } from '@jump/util'

import MatchResult from './MatchResult'
import routePath from './routePath'

export class Route {
  /**
   * Represents a route
   * @constructor
   * @param {string} name - Name for the route.
   * @param {string} path - Path pattern used by to match the route
   */
  constructor (params) {
    const requiredRarams = ['name', 'path']
    for (const param of requiredRarams) {
      if (!(param in params)) {
        throw new Error(`Missing route param ${param}: ${JSON.stringify(params)}`)
      }
    }

    // Allow for dynamic params in routes to be used with
    // custom redirects etc.
    // TODO: fix this
    for (const [k, v] of Object.entries(params)) {
      if (['is', 'match', 'buildUrl'].includes(k)) {
        throw new Error(`Invalid route param ${k}`)
      }
      this[k] = v
    }

    this._routePath = routePath(this.path)
  }

  /**
  * Check whether this route matches a passed path or route.
  * @return {MatchedRoute}
  */
  // you can either pass a path to match
  match (args) {
    const fn = args.url ?  '_matchUrl' : '_matchRoute'
    return this[fn](args)
  }

  is (test) {
    if (test.indexOf('/') !== -1) {
      return !!this._routePath.match(test)
    } else {
      return (this.name === test)
    }
  }

  _matchUrl (input) {
    const {url} = input

    const {
      searchParams,
      pathname,
    } = parseUrlOrPath(url)

    const pathParams = this._routePath.match(pathname)
    if (!pathParams) {
      return false
    }

    const queryParams = Array.from(searchParams.entries()).reduce((qp, [k, v])=> {
      const hasKey = k in qp
      const existing = qp[k]
      const value = hasKey ? Array.isArray(existing) ? [...existing, v] : [existing, v] : v
      return {
        ...qp,
        [k]: value
      }
    }, {})

    const params = {
      ...pathParams,
      ...queryParams,
    }

    return new MatchResult({
      route: this,
      input,
      params
    })
  }

  // matches if
  // 1) name matches
  // 2) all named params are present
  _matchRoute (input) {
    const {route} = input
    const {name, params = {}} = route

    // Name of passed route must match this route's name
    if (name !== this.name) {
      return false
    }

    const paramNames = this._requiredParamNames()
    const hasAllParams = paramNames.every((name)=> name in params)
    if (!hasAllParams) {
      return false
    }

    // All named params are present, its a match
    return new MatchResult({
      input,
      route: this,
      params
    })
  }

  buildUrl (params = {}) {
    let url = this._routePath.build(params)
    const query = this._buildQuery(params)
    if (query.length) {
      url = `${url}?${query}`
    }
    return url
  }

  _buildQuery (params) {
    const paramNames = this._paramNames()

    const searchParams = new URLSearchParams()
    for (const [name, value] of Object.entries(params)) {
      if (!paramNames.includes(name)) {
        const values = Array.isArray(value) ? value : [value]
        for (const value of values) {
          searchParams.append(name, value)
        }
      }
    }

    return searchParams.toString()
  }

  _paramNames () {
    return this._routePath.namedParams.map((k)=> k.name)
  }

  _requiredParamNames () {
    return this._routePath.namedParams
      .filter((k)=> !k.optional)
      .map((k)=> k.name)
  }
}

export default Route