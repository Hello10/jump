import { Router as JumpRouter } from '@jump/router'

import { useSingleton, Singleton } from './useSingleton'

export class Router extends Singleton {
  initialize (options) {
    this.history = []

    if (('web' in options)) {
      this.web = !!options.web
    } else {
      this.web = !!(window && window.location && window.history)
    }

    if (this.web) {
      window.addEventListener('popstate', (event)=> this.#onPopState(event))
    }

    this.onGoCallback = options.onGo

    const {routes, redirects} = options
    this.router = new JumpRouter({routes, redirects})
    this.router.onGo((match) => this.#onGo(match))

    const { logger } = options
    this.logger = logger ? logger.child({ web: this.web }) : null
    this.logger?.debug('Initializing router')

    return {
      match: null,
      error: null,
      input: null
    }
  }

  get url () {
    return this.match?.url
  }

  get error () {
    return this.state.error
  }

  get match () {
    return this.state.match
  }

  get route () {
    return this.match?.route
  }

  get params () {
    return this.match?.params
  }

  get page () {
    return this.route?.page
  }

  get input () {
    return this.state.input
  }

  start ({url, ...input} = {}) {
    this.logger?.debug('Router start', { url, input })
    if (!url) {
      url = '/'
      if (this.web) {
        const {location} = global
        const {pathname, search} = location
        url = `${pathname}${search}`
      }
    }
    const match = this.router.match({ ...input, url })
    this.#handleMatch({ match, input })
    return match
  }

  go (args) {
    args = {
      ...this.input,
      ...this.router.normalizeInput(args)
    }
    this.logger?.debug('Router go', {args, current: this.url})
    this.router.go(args)
  }

  back () {
    const state = this.history.pop()
    if (!state) {
      return
    }
    if (this.web) {
      window.history.back()
    } else {
      this.#onPopState({state})
    }
  }

  #handleMatch = ({match, input})=> {
    this.logger?.debug('Router handling match', {match, input})
    if (match) {
      if (match.url !== this.url) {
        const state = {url: match.url}
        this.history.push(state)
        if (this.web) {
          window.history.pushState(state, '', match.url)
        }
      }
      this.setState({match, input, error: null})
    } else {
      const error = new Error('No match from router')
      this.setState({match, input, error})
    }
  }

  #onGo = (match)=> {
    this.logger?.debug('Router onGo called', {match})
    const {input} = this
    this.#handleMatch({match, input})
    if (this.onGoCallback) {
      this.onGoCallback(this.state)
    }
  }

  #onPopState = ({state})=> {
    const {url} = state
    const {input} = this
    const match = this.router.match({...input, url})
    if (match) {
      this.setState({match, input, error: null})
    } else {
      const error = new Error('No match from router')
      this.setState({match, input, error})
    }
  }
}

export function useRouter(options) {
  return useSingleton(Router, options)
}


// export function useLocationSearch () {
//   const search = window.location.search
//   const params = new URLSearchParams(search)
//   return params
// }
