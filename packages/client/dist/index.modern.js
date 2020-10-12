import 'babel-polyfill';
import { useSingleton } from '@hello10/react-hooks';
export * from '@hello10/react-hooks';
import React__default, { createElement, useEffect } from 'react';
import { useQuery, HttpLink, from, InMemoryCache, ApolloClient } from '@apollo/client';
import Logger from '@hello10/logger';
import PropTypes from 'prop-types';
import { setContext } from '@apollo/client/link/context';
import Groutcho from 'groutcho';

const logger = new Logger('jump');

const logger$1 = logger.child('PageContainer');

function Query({
  Loading,
  Error,
  Page,
  ...page_props
}) {
  const {
    name,
    params,
    user
  } = page_props;
  const {
    query: query_gql,
    ...options
  } = Page.query({
    params,
    user
  });
  const query = useQuery(query_gql, options);
  const {
    loading,
    error,
    data
  } = query;
  logger$1.debug('Rendering page container query', { ...page_props,
    loading,
    error,
    data
  });

  if (loading) {
    logger$1.debug(`Rendering loading for ${name}`);
    return /*#__PURE__*/createElement(Loading, Object.assign({
      Page: Page,
      query: query
    }, page_props));
  } else if (error) {
    logger$1.debug(`Rendering error for ${name}`);
    return /*#__PURE__*/createElement(Error, Object.assign({
      Page: Page,
      error: error,
      query: query
    }, page_props));
  } else {
    logger$1.debug(`Rendering loaded for ${name}`);
    return /*#__PURE__*/createElement(Page, Object.assign({
      data: data,
      query: query
    }, page_props));
  }
}

function PageContainer({
  Loading,
  Error,
  match,
  user
}) {
  const {
    route,
    params
  } = match;
  const {
    page: Page,
    name
  } = route;
  const page_props = {
    match,
    route,
    params,
    user,
    name
  };

  if (Page.query) {
    return /*#__PURE__*/createElement(Query, Object.assign({
      Loading: Loading,
      Error: Error,
      Page: Page
    }, page_props));
  } else {
    return /*#__PURE__*/createElement(Page, Object.assign({
      data: {},
      query: null
    }, page_props));
  }
}

function ApplicationContainer({
  ApplicationLoading,
  Container,
  PageLoading,
  PageError,
  client,
  useRouter,
  useSession,
  ...props
}) {
  const logger$1 = logger.child('ApplicationContainer');
  logger$1.debug('Rendering ApplicationContainer');
  const router = useRouter();
  const session = useSession();
  const {
    user
  } = session;
  useEffect(() => {
    logger$1.debug('Loading session');
    session.load();
    return () => {
      logger$1.debug('Unloading session');
      session.unload();
    };
  }, []);
  useEffect(() => {
    logger$1.debug('Running router', {
      user
    });

    if (!session.loaded) {
      return;
    }

    const match = router.start({
      user
    });

    if (match?.redirect) {
      const {
        route
      } = match;
      let msg = 'Got redirect';
      const name = route?.name;

      if (name) {
        msg = `${msg} to ${name}`;
      }

      logger$1.info(msg, {
        match
      });
    }
  }, [user]);

  if (session.loaded && router.match) {
    return /*#__PURE__*/React__default.createElement(Container, {
      match: router.match
    }, /*#__PURE__*/React__default.createElement(PageContainer, Object.assign({
      Loading: PageLoading,
      Error: PageError,
      match: router.match,
      client: client
    }, props)));
  } else {
    return /*#__PURE__*/React__default.createElement(ApplicationLoading, Object.assign({
      error: session.error || router.error,
      user: user
    }, props));
  }
}
ApplicationContainer.whyDidYouRender = {
  logOnDifferentValues: true
};
ApplicationContainer.propTypes = {
  ApplicationLoading: PropTypes.func,
  Container: PropTypes.func,
  PageLoading: PropTypes.func,
  PageError: PropTypes.func,
  client: PropTypes.object,
  useRouter: PropTypes.func,
  useSession: PropTypes.func
};

function buildEnum(types) {
  return types.reduce((Types, type) => {
    Types[type] = type;
    return Types;
  }, {});
}

const types = buildEnum(['array', 'first', 'last']);

function indexer(arg) {
  if (!arg) {
    arg = {
      attr: 'id',
      type: types.first
    };
  }

  if (arg.constructor === String) {
    arg = {
      attr: arg
    };
  }

  const {
    attr,
    type = types.array
  } = arg;

  if (!(type in types)) {
    throw new Error('Invalid index type');
  }

  return function index(items) {
    const index = {};

    for (const item of items) {
      const value = item[attr];
      const has_value = (value in index);

      if (type === types.array) {
        if (!has_value) {
          index[value] = [];
        }

        index[value].push(item);
      } else if (type === types.first) {
        if (!has_value) {
          index[value] = item;
        }
      } else {
        index[value] = item;
      }
    }

    return index;
  };
}

for (const [k, v] of Object.entries(types)) {
  indexer[k] = v;
}

const indexById = indexer();

const mapp = function (iterable, map, options = {}) {
  try {
    let concurrency = options.concurrency || Infinity;
    let index = 0;
    const results = [];
    const runs = [];
    const iterator = iterable[Symbol.iterator]();
    const sentinel = Symbol('sentinel');

    function run() {
      const {
        done,
        value
      } = iterator.next();

      if (done) {
        return sentinel;
      } else {
        const i = index++;
        const p = map(value, i);
        return Promise.resolve(p).then(result => {
          results[i] = result;
          return run();
        });
      }
    }

    while (concurrency-- > 0) {
      const r = run();

      if (r === sentinel) {
        break;
      } else {
        runs.push(r);
      }
    }

    return Promise.all(runs).then(() => results);
  } catch (e) {
    return Promise.reject(e);
  }
};
var mapp_1 = mapp;

class Session extends useSingleton.Singleton {
  initialize() {
    const {
      Firebase,
      SessionUser,
      client,
      shouldEndSessionOnError = () => {
        return true;
      }
    } = this.options;
    SessionUser.client = client;
    const user = new SessionUser();
    this.Firebase = Firebase;
    this.SessionUser = SessionUser;
    this.client = client;
    this.shouldEndSessionOnError = shouldEndSessionOnError;
    this.logger = logger.child({
      name: 'Session',
      user
    });
    return {
      user,
      changing: false,
      loaded: false,
      error: null
    };
  }

  get user() {
    return this.state.user;
  }

  set user(data) {
    const user = new this.SessionUser(data);
    this.setState({
      user
    });
  }

  get changing() {
    return this.state.changing;
  }

  get loaded() {
    return this.state.loaded;
  }

  get error() {
    return this.state.error;
  }

  get load_error() {
    return this.loaded ? null : this.error;
  }

  apps(fn) {
    return mapp_1(this.Firebase.apps, fn);
  }

  async load() {
    var _this = this;

    this.logger.debug('Loading session');
    return this._change(async function () {
      await _this.client.loadAuth();
      const user = await _this.SessionUser.load();

      _this.logger.debug('Session loaded', {
        user
      });

      return {
        user,
        loaded: true
      };
    });
  }

  unload() {}

  start(args) {
    var _this2 = this;

    this.logger.debug('Starting session');
    return this._change(async function () {
      const {
        user,
        auth
      } = await _this2.SessionUser.start(args);

      _this2.logger.debug('Session started, setting auth', {
        user
      });

      await _this2.client.setAuth(auth);
      await _this2.apps(app => {
        const app_token = auth.app_tokens.find(({
          name
        }) => name === app.name);

        if (!app_token) {
          return null;
        }

        return app.auth().signInWithCustomToken(app_token.token);
      });
      return {
        user
      };
    });
  }

  refresh() {
    var _this3 = this;

    const {
      SessionUser
    } = this;

    if (SessionUser.refresh) {
      this.logger.debug('No refresh method defined on SessionUser');
      return null;
    }

    this.logger.debug('Refreshing session');
    return this._change(async function () {
      const {
        client
      } = _this3;
      const client_auth = await client.getAuth();
      const data = await SessionUser.refresh(client_auth);
      const {
        user,
        auth
      } = data;

      _this3.logger.debug('Session refreshed, setting auth', {
        user
      });

      await client.setAuth(auth);
      return {
        user
      };
    });
  }

  end(args) {
    var _this4 = this;

    const {
      SessionUser
    } = this;
    this.logger.debug('Ending session');
    return this._change(async function () {
      try {
        await SessionUser.end(args);

        _this4.logger.debug('Session ended');
      } catch (error) {
        _this4.logger.error('Error ending session', error);
      }

      await _this4.client.clearAuth();
      await _this4.apps(app => {
        app.auth().signOut();
      });
      const user = new SessionUser();
      return {
        user
      };
    });
  }

  async _change(action) {
    if (!this.changing) {
      this.setState({
        changing: true
      });
    }

    try {
      const state = await action();
      this.setState({
        changing: false,
        error: null,
        ...state
      });
    } catch (error) {
      this.logger.error('Session error', {
        error
      });
      let {
        user
      } = this;

      if (this.shouldEndSessionOnError(error)) {
        this.logger.debug('Clearing session on error');
        await this.client.clearAuth();
        user = null;
      }

      this.setState({
        changing: false,
        user,
        error
      });
    }
  }

}

class FirebaseSession extends Session {
  get auth() {
    return this.Firebase.auth();
  }

  async load() {
    var _this = this;

    this.logger.debug('Loading session');
    this.setState({
      changing: true
    });
    const {
      SessionUser,
      client
    } = this;
    this.unsubscribe = this.auth.onAuthStateChanged(async function (firebase_user) {
      _this.logger.debug('Firebase auth state changed', {
        firebase_user
      });

      await _this._change(async function () {
        let user;

        if (firebase_user) {
          _this.logger.debug('Getting firebase user token');

          const token = await firebase_user.getIdToken(true);
          client.setAuth({
            token
          });

          _this.logger.debug('Loading session user');

          user = await SessionUser.load({
            client,
            token,
            firebase_user
          });
        } else {
          _this.logger.debug('No firebase user clearing session');

          await client.clearAuth();
          user = new SessionUser();
        }

        return {
          user,
          loaded: true
        };
      });
    });
  }

  async unload() {
    this.logger.debug('Unsubscribing from Firebase auth listener');
    this.unsubscribe();
  }

  async start({
    email,
    password,
    provider: provider_name,
    popup = false
  }) {
    const provider_method = popup ? 'signInWithPopup' : 'signInWithRedirect';
    const dedicated_providers = ['Google', 'Facebook', 'Twitter', 'Github'];
    const oauth_providers = ['Yahoo', 'Microsoft', 'Apple'];

    function invalidMode() {
      throw new Error(`Invalid auth mode: ${provider_name}`);
    }

    const {
      Firebase,
      auth
    } = this;

    try {
      let credential;

      if (provider_name.includes('Email')) {
        if (provider_name === 'EmailSignin') {
          this.logger.debug('Signing in with email', {
            email
          });
          credential = await auth.signInWithEmailAndPassword(email, password);
        } else if (provider_name === 'EmailSignup') {
          this.logger.debug('Signing up with email', {
            email
          });
          credential = await auth.createUserWithEmailAndPassword(email, password);
          this.logger.debug('Sending session email verification');
          await credential.user.sendEmailVerification();
        } else {
          invalidMode();
        }
      } else if (dedicated_providers.includes(provider_name)) {
        const Provider = Firebase.auth[`${provider_name}AuthProvider`];
        const provider = new Provider();
        this.logger.debug('Authorizing via dedicated provider', {
          provider_name,
          provider_method
        });
        credential = await auth[provider_method](provider);
      } else if (oauth_providers.includes(provider_name)) {
        const domain = `${provider_name.toLowerCase()}.com`;
        const provider = new Firebase.auth.OAuthProvider(domain);
        this.logger.debug('Authorizing via OAuth provider', {
          domain,
          provider_method
        });
        credential = await auth[provider_method](provider);
      } else {
        invalidMode();
      }

      return credential;
    } catch (error) {
      this.logger.debug('Error authenticating', error);
      throw error;
    }
  }

  async end() {
    this.setState({
      changing: true
    });
    return this.auth.signOut();
  }

}

const NO_SESSION = {
  token: null,
  refresh_token: null
};
let auth = null;
function getClient({
  uri,
  storage,
  storage_key = 'JUMP_AUTH',
  options = {},
  cache_options = {}
}) {
  const logger$1 = logger.child({
    name: 'getClient',
    uri
  });
  logger$1.info('Getting client');
  const http_link = new HttpLink({
    uri
  });
  const auth_link = setContext(async (request, prev_context) => {
    const {
      headers = {}
    } = prev_context;

    if (!auth) {
      await loadAuth();
    }

    const {
      token
    } = auth;

    if (token) {
      logger$1.debug('Adding auth token to header');
      headers.authorization = token ? `Bearer ${token}` : '';
    }

    return {
      headers
    };
  });
  const link = from([auth_link, http_link]);
  const cache = new InMemoryCache(cache_options);
  const client = new ApolloClient({
    link,
    cache,
    defaultOptions: options
  });

  function writeAuthToStorage(auth) {
    logger$1.debug('Writing auth to storage');
    const json = JSON.stringify(auth);
    return storage.setItem(storage_key, json);
  }

  async function readAuthFromStorage() {
    logger$1.debug('Reading auth from storage');
    let auth;

    try {
      const json = await storage.getItem(storage_key);
      auth = JSON.parse(json) || NO_SESSION;
    } catch (error) {
      auth = NO_SESSION;
    }

    return auth;
  }

  async function setAuth(new_auth) {
    logger$1.debug('Setting session auth');

    if (storage) {
      await writeAuthToStorage(new_auth);
    }

    auth = new_auth;
  }

  async function loadAuth() {
    if (!storage) {
      throw new Error('No storage specified to load auth from');
    }

    logger$1.debug('Loading session auth');
    auth = await readAuthFromStorage();
    return auth;
  }

  async function clearAuth() {
    logger$1.debug('Clearing session auth');
    setAuth(NO_SESSION);
  }

  client.setAuth = setAuth;
  client.loadAuth = loadAuth;
  client.clearAuth = clearAuth;
  return client;
}

function getGraphQLErrorCode(error) {
  if (error.graphQLErrors) {
    [error] = error.graphQLErrors;
  }

  return error?.extensions?.code;
}

function getSubdomain(hostname) {
  const parts = hostname.split('.');
  let last_index = -2;
  const last = parts[parts.length - 1];
  const is_localhost = last === 'localhost';

  if (is_localhost) {
    last_index = -1;
  }

  return parts.slice(0, last_index).join('.');
}

function subdomainApps(map) {
  const main = map.find(item => item.main);

  if (!main) {
    throw new Error('Must set main flag to true on at least one subdomain app');
  }

  return function getApp() {
    const {
      hostname
    } = window.location;
    const subdomain = getSubdomain(hostname);

    if (!subdomain) {
      return main.app;
    }

    const app = map.find(({
      subdomains
    }) => subdomains.includes(subdomain));

    if (app) {
      return app.app;
    } else {
      return main.app;
    }
  };
}

class Router extends useSingleton.Singleton {
  initialize() {
    this.history = [];

    if ('web' in this.options) {
      this.web = this.options.web;
    } else {
      this.web = !!(window && window.location && window.history);
    }

    if (this.web) {
      window.addEventListener('popstate', this._onPopState.bind(this));
    }

    const {
      routes,
      redirects
    } = this.options;
    this.router = new Groutcho.Router({
      routes,
      redirects
    });
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

  get url() {
    return this.match?.url;
  }

  get error() {
    return this.state.error;
  }

  get match() {
    return this.state.match;
  }

  get route() {
    return this.match?.route;
  }

  get params() {
    return this.match?.params;
  }

  get page() {
    return this.route?.page;
  }

  get input() {
    return this.state.input;
  }

  start({
    url,
    ...input
  }) {
    if (!url) {
      url = '/';

      if (this.web) {
        const {
          location
        } = window;
        const {
          pathname,
          search
        } = location;
        url = `${pathname}${search}`;
      }
    }

    const match = this.router.match({ ...input,
      url
    });

    this._handleMatch({
      match,
      input
    });

    return match;
  }

  go(args) {
    args = { ...this.input,
      ...this.router._normalizeInput(args)
    };
    this.logger.debug('Router go called', {
      args,
      current: this.url
    });
    this.router.go(args);
  }

  back() {
    const state = this.history.pop();

    if (!state) {
      return;
    }

    if (this.web) {
      window.history.back();
    } else {
      this._onPopState({
        state
      });
    }
  }

  _handleMatch({
    match,
    input
  }) {
    this.logger.debug('Router handling match', {
      match,
      input
    });

    if (match) {
      if (match.url !== this.url) {
        const state = {
          url: match.url
        };
        this.history.push(state);

        if (this.web) {
          window.history.pushState(state, '', match.url);
        }

        this.setState({
          match,
          input,
          error: null
        });
      }
    } else {
      const error = new Error('No match from router');
      this.setState({
        match,
        input,
        error
      });
    }
  }

  _onGo(match) {
    this.logger.debug('Router onGo called', {
      match
    });
    const {
      input
    } = this;

    this._handleMatch({
      match,
      input
    });

    const {
      onGo
    } = this.options;

    if (onGo) {
      onGo(this.state);
    }
  }

  _onPopState({
    state
  }) {
    const {
      url
    } = state;
    const {
      input
    } = this;
    const match = this.router.match({ ...input,
      url
    });

    if (match) {
      this.setState({
        match,
        input,
        error: null
      });
    } else {
      const error = new Error('No match from router');
      this.setState({
        match,
        input,
        error
      });
    }
  }

}

export { ApplicationContainer, FirebaseSession, PageContainer, Router, Session, getClient, getGraphQLErrorCode, getSubdomain, subdomainApps };
//# sourceMappingURL=index.modern.js.map
