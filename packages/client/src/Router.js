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

    const {routes, redirects} = this.options;
    this.router = new Groutcho.Router({routes, redirects});
    this.router.onGo(this._onGo.bind(this));

    let url = '/';
    if (this.web) {
      const {location} = window;
      const {pathname, search} = location;
      url = `${pathname}${search}`;
      window.addEventListener('popstate', this._onPopState.bind(this));
    }

    this.logger = logger.child({
      name: 'Router',
      web: this.web
    });

    this.logger.debug('Initializing router');

    return {url};
  }

  get url () {
    return this.state.url;
  }

  match (input) {
    this.input = input;
    const match = this.router.match({
      ...input,
      url: this.url
    });
    const {redirect, url} = match;
    if (redirect) {
      this._setUrl(url);
    }
    this.logger.debug('Router got match', {match, input});
    return match;
  }

  go (args) {
    args = {
      ...this.input,
      ...this.router._normalizeInput(args)
    };
    this.logger.debug('Router go called', {args, url: this.url});
    this.router.go(args);
  }

  back () {
    const last = this.history.pop();
    if (!last) {
      return;
    }
    this.go(last);
  }

  _setUrl (url) {
    this.logger.debug('Setting router url', url);
    if (url !== this.url) {
      const state = {url};
      this.setState(state);
      this.history.push(state);
      if (this.web) {
        window.history.pushState(state, '', url);
      }
    }
  }

  _onGo (match) {
    this.logger.debug('Router onGo called', {match, current: this.url});
    const {url} = match;
    if (url !== this.url) {
      this._setUrl(url);
      const {onGo} = this.options;
      if (onGo) {
        onGo(match);
      }
    }
  }

  _onPopState ({state}) {
    this.setState(state);
  }
}
