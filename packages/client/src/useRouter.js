import {useSingleton} from '@hello10/react-hooks';
import {Router} from 'groutcho';

class SingletonRouter extends useSingleton.Singleton {
  initialize () {
    this.history = [];

    if (('web' in this.options)) {
      this.web = this.options.web;
    } else {
      this.web = !!(window && window.location && window.history);
    }

    const {routes, redirects} = this.options;
    this.router = new Router({routes, redirects});
    this.router.onGo(this._onGo.bind(this));

    let url = '/';
    if (this.web) {
      const {location} = window;
      const {pathname, search} = location;
      url = `${pathname}${search}`;
      window.addEventListener('popstate', this._onPopState.bind(this));
    }

    return {url};
  }

  get url () {
    return this.state.url;
  }

  match (input) {
    const match = this.router.match({
      ...input,
      url: this.url
    });
    const {redirect, url} = match;
    if (redirect) {
      this._setUrl(url);
    }
    return match;
  }

  go (args) {
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
    const state = {url};
    this.setState(state);
    this.history.push(state);
    if (this.web) {
      window.history.pushState(state, '', url);
    }
  }

  _onGo (new_url) {
    if (new_url !== this.url) {
      this._setUrl(new_url);
      const {onGo} = this.options;
      if (onGo) {
        onGo(new_url);
      }
    }
  }

  _onPopState ({state}) {
    this.setState(state);
  }
}

export default function useRouter (options = {}) {
  return useSingleton(SingletonRouter, options);
}
