import {useSingleton} from '@hello10/react-hooks';
import Groutcho from 'groutcho';

import logger from './logger';

export default class Router extends useSingleton.Singleton {
  initialize () {
    this.history = [];

    if (('web' in this.options)) {
      this.web = this.options.web;
    } else {
      this.web = !!(window && window.location && window.history);
    }

    if (this.web) {
      window.addEventListener('popstate', this._onPopState.bind(this));
    }

    const {routes, redirects} = this.options;
    this.router = new Groutcho.Router({routes, redirects});
    this.router.onGo(this._onGo.bind(this));

    this.logger = logger.child({
      name: 'Router',
      web: this.web
    });

    this.logger.debug('Initializing router');

    return {
      match: null,
      error: null,
      input: null
    };
  }

  get url () {
    return this.match?.url;
  }

  get error () {
    return this.state.error;
  }

  get match () {
    return this.state.match;
  }

  get route () {
    return this.match?.route;
  }

  get params () {
    return this.match?.params;
  }

  get page () {
    return this.route?.page;
  }

  get input () {
    return this.state.input;
  }

  start ({url, ...input}) {
    this.logger.debug('Router start', {url, input});
    if (!url) {
      url = '/';
      if (this.web) {
        const {location} = window;
        const {pathname, search} = location;
        url = `${pathname}${search}`;
      }
    }
    const match = this.router.match({...input, url});
    this._handleMatch({match, input});
    return match;
  }

  go (args) {
    args = {
      ...this.input,
      ...this.router._normalizeInput(args)
    };
    this.logger.debug('Router go', {args, current: this.url});
    this.router.go(args);
  }

  back () {
    const state = this.history.pop();
    if (!state) {
      return;
    }
    if (this.web) {
      window.history.back();
    } else {
      this._onPopState({state});
    }
  }

  _handleMatch ({match, input}) {
    this.logger.debug('Router handling match', {match, input});
    if (match) {
      if (match.url !== this.url) {
        const state = {url: match.url};
        this.history.push(state);
        if (this.web) {
          window.history.pushState(state, '', match.url);
        }
      }
      this.setState({match, input, error: null});
    } else {
      const error = new Error('No match from router');
      this.setState({match, input, error});
    }
  }

  _onGo (match) {
    this.logger.debug('Router onGo called', {match});
    const {input} = this;
    this._handleMatch({match, input});
    const {onGo} = this.options;
    if (onGo) {
      onGo(this.state);
    }
  }

  _onPopState ({state}) {
    const {url} = state;
    const {input} = this;
    const match = this.router.match({...input, url});
    if (match) {
      this.setState({match, input, error: null});
    } else {
      const error = new Error('No match from router');
      this.setState({match, input, error});
    }
  }
}
