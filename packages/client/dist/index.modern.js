import 'babel-polyfill';
import { useState, useEffect, createElement } from 'react';
import PropTypes from 'prop-types';
import { useSingleton } from '@hello10/react-hooks';
import gql from 'graphql-tag';
import { ApolloClient } from 'apollo-client';
import { setContext } from 'apollo-link-context';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import get from 'lodash.get';
import Groutcho from 'groutcho';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

const Levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
const CONFIG_DELIMITER = ',';
const PART_DELIMITER = '|';
const NAME_DELIMITER = ':';
const CONFIG_SPLIT_REGEX = new RegExp(`[\\s${CONFIG_DELIMITER}]+`);
const PART_SPLIT_REGEX = new RegExp(`[\\s${PART_DELIMITER}]+`);
const ENV_KEY = 'LOGGER';

function isString(arg) {
  return (arg == null ? void 0 : arg.constructor) === String;
}

function isError(arg) {
  return arg instanceof Error;
}

function bounded(pattern) {
  return new RegExp(`^${pattern}$`);
}

class Logger {
  constructor(context = {}) {
    if (isString(context)) {
      context = {
        name: context
      };
    }

    if (!('name' in context)) {
      throw new Error('Must specify name for logger');
    }

    this.context = context;
    const {
      name
    } = context;
    this.name = name;
  }

  static set time(fn) {
    this._time = fn;
  }

  static enabled({
    level,
    name
  }) {
    const memo_key = [level, name].join(PART_DELIMITER);

    if (memo_key in this.memo) {
      return this.memo[memo_key];
    }

    for (const exclude of this.excludes) {
      if (exclude.test(name)) {
        this.memo[memo_key] = false;
        return false;
      }
    }

    const enabled = this.includes.some(include => {
      const level_index = Levels.indexOf(level);
      const this_index = Levels.indexOf(include.level);
      const level_enabled = level_index >= this_index;
      return level_enabled && include.name.test(name);
    });
    this.memo[memo_key] = enabled;
    return enabled;
  }

  static set config(configs) {
    this.includes = [];
    this.excludes = [];
    this.memo = {};

    if (!Array.isArray(configs)) {
      if (isString(configs)) {
        configs = configs.split(CONFIG_SPLIT_REGEX);
      } else {
        throw new Error('When setting .config pass string or array of strings');
      }
    }

    for (let config of configs) {
      const is_exclude = config[0] === '-';

      if (is_exclude) {
        if (config.includes(PART_DELIMITER)) {
          throw new Error('Exclude roles should not include level');
        }

        const _name = bounded(config.substr(1));

        this.excludes.push(_name);
      }

      let [name, level] = config.split(PART_SPLIT_REGEX);
      name = name.replace(/\*/g, '.*?');
      name = bounded(name);

      if (!level) {
        level = 'error';
      }

      const valid_level = Levels.includes(level);

      if (!valid_level) {
        throw new Error(`Invalid level ${level}`);
      }

      this.includes.push({
        name,
        level
      });
    }
  }

  static readConfig() {
    function read() {
      let config;

      if (typeof process !== 'undefined') {
        var _process$env;

        config = (_process$env = process.env) == null ? void 0 : _process$env[ENV_KEY];

        if (config) {
          return config;
        }
      }

      if (typeof window !== 'undefined') {
        var _window$localStorage;

        config = (_window$localStorage = window.localStorage) == null ? void 0 : _window$localStorage[ENV_KEY];

        if (config) {
          return config;
        }
      }

      return '*';
    }

    this.config = read();
  }

  child(context = {}) {
    if (isString(context)) {
      context = {
        name: context
      };
    }

    let {
      name
    } = this.context;

    if ('name' in context) {
      name = [name, context.name].join(NAME_DELIMITER);
    }

    const new_context = _extends({}, this.context, context, {
      name
    });

    const child = new this.constructor(new_context);
    child.level = this.level;
    return child;
  }

  _log(...args) {
    let body = _extends({}, this.context);

    for (const arg of args) {
      const has_message = ('message' in body);

      if (isString(arg)) {
        if (!has_message) {
          body.message = arg;
        }
      } else if (isError(arg)) {
        if (!has_message) {
          body.message = arg.message;
        }

        const props = Object.getOwnPropertyNames(arg);
        const payload = props.reduce((payload, key) => {
          payload[key] = arg[key];
          return payload;
        }, {});
        body.error = JSON.stringify(payload);
      } else if (arg) {
        body = _extends({}, body, arg);
      }
    }

    if (!('time' in body)) {
      body.time = this.constructor._time();
    }

    return body;
  }

}

Logger.includes = [];
Logger.excludes = [];
Logger.memo = {};

Logger._time = function () {
  return new Date().toISOString();
};

Logger.levels = Levels;
Levels.forEach(level => {
  const {
    console
  } = commonjsGlobal;
  const fn = level === 'fatal' ? 'error' : level;

  Logger.prototype[level] = function log(...args) {
    const body = this._log(...args);

    const {
      message,
      name
    } = body;
    const enabled = Logger.enabled({
      level,
      name
    });

    if (enabled) {
      console[fn](message, body);
    }
  };

  Levels[level] = level;
});
Logger.readConfig();
var dist = Logger;

const logger = new dist('jump');

function PageContainer({
  Loading,
  Error,
  match,
  client
}) {
  const {
    params,
    route
  } = match;
  const {
    page: Page,
    name
  } = route;
  const logger$1 = logger.child('PageContainer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  logger$1.debug('Rendering page container', {
    match,
    loading,
    error,
    data
  });
  useEffect(() => {
    let unmounted = false;

    async function runQuery() {
      if (unmounted) {
        logger$1.debug('Skipping unmounted query');
        return;
      }

      try {
        const page_query = Page.query(params);
        logger$1.debug('Running query', page_query);
        const {
          data
        } = await client.query(page_query);
        logger$1.debug('Ran query', data);
        setData(data);
      } catch (error) {
        logger$1.error('Error running query', error);
        setError(error);
      } finally {
        logger$1.debug('Done loading');
        setLoading(false);
      }
    }

    if (Page.query) {
      runQuery();
    } else {
      setLoading(false);
    }

    return () => {
      logger$1.debug('Unmounting page container');
      setLoading(true);
      setError(null);
      setData(null);
      unmounted = true;
    };
  }, [match]);
  const props = {
    Page,
    match,
    route,
    params
  };

  if (loading) {
    logger$1.debug(`Rendering loading for ${name}`);
    return /*#__PURE__*/createElement(Loading, props);
  } else if (error) {
    logger$1.debug(`Rendering error for ${name}`);
    return /*#__PURE__*/createElement(Error, Object.assign({
      error: error
    }, props));
  } else {
    logger$1.debug(`Rendering loaded for ${name}`);
    return /*#__PURE__*/createElement(Page, Object.assign({
      match: match,
      params: params,
      route: route
    }, data));
  }
}
PageContainer.propTypes = {
  Loading: PropTypes.func,
  Error: PropTypes.func,
  match: PropTypes.object,
  client: PropTypes.object
};

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
  const session = useSession();
  const router = useRouter();
  useEffect(() => {
    logger$1.debug('Loading session');
    session.load();
    return () => {
      logger$1.debug('Unloading session');
      session.unload();
    };
  }, []);
  const {
    user,
    loaded,
    error
  } = session;

  if (loaded) {
    logger$1.debug('Running router', {
      session,
      user
    });
    const match = router.match({
      user
    });

    if (match.redirect) {
      let msg = 'Got redirect';
      const name = match.route?.name;

      if (name) {
        msg = `${msg} to ${name}`;
      }

      logger$1.info(msg, {
        match
      });
    }

    return /*#__PURE__*/createElement(Container, {
      match: match
    }, /*#__PURE__*/createElement(PageContainer, Object.assign({
      Loading: PageLoading,
      Error: PageError,
      match: match,
      client: client
    }, props)));
  } else {
    return /*#__PURE__*/createElement(ApplicationLoading, Object.assign({
      error: error,
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

class Session extends useSingleton.Singleton {
  initialize() {
    const {
      SessionUser,
      client,
      shouldEndSessionOnError = () => {
        return true;
      }
    } = this.options;
    SessionUser.client = client;
    const user = new SessionUser();
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
        _this4.logger.error('Error ending sesssion', error);
      }

      await _this4.client.clearAuth();
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
    return this.options.auth;
  }

  get Firebase() {
    return this.options.Firebase;
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
    const auth = this.Firebase.auth();
    this.unsubscribe = auth.onAuthStateChanged(async function (firebase_user) {
      _this.logger.debug('Firebase auth state changed', {
        firebase_user
      });

      _this._change(async function () {
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

let _ = t => t,
    _t;
const NO_SESSION = {
  token: null,
  refresh_token: null
};
function getClient({
  uri,
  storage,
  storage_key = 'JUMP_AUTH'
}) {
  const logger$1 = logger.child({
    name: 'getClient',
    uri
  });
  logger$1.info('Getting client');
  const http_link = createHttpLink({
    uri
  });
  const auth_link = setContext(async (request, prev_context) => {
    const {
      headers = {}
    } = prev_context;
    const {
      token
    } = await readClientAuth();

    if (token) {
      logger$1.debug('Adding auth token to header');
      headers.authorization = token ? `Bearer ${token}` : '';
    }

    return {
      headers
    };
  });
  const link = auth_link.concat(http_link);
  const cache = new InMemoryCache();
  const client = new ApolloClient({
    link,
    cache
  });
  writeClientAuth(NO_SESSION);

  async function readClientAuth() {
    logger$1.debug('Getting client auth');
    const query = gql(_t || (_t = _`
      {
        token @client
        refresh_token @client
      }
    `));
    const {
      data
    } = await client.query({
      query
    });
    return data;
  }

  function writeClientAuth(auth) {
    logger$1.debug('Setting client auth');
    return client.writeData({
      data: auth
    });
  }

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
      auth = JSON.parse(json) || {};
    } catch (error) {
      auth = {};
    }

    return auth;
  }

  async function setAuth(auth) {
    logger$1.debug('Setting session auth');

    if (storage) {
      await writeAuthToStorage(auth);
    }

    return writeClientAuth(auth);
  }

  async function loadAuth() {
    if (!storage) {
      throw new Error('No storage specified to load auth from');
    }

    logger$1.debug('Loading session auth');
    const auth = await readAuthFromStorage();
    return writeClientAuth(auth);
  }

  async function clearAuth() {
    logger$1.debug('Clearing session auth');

    if (storage) {
      await writeAuthToStorage(NO_SESSION);
    }

    return writeClientAuth(NO_SESSION);
  }

  client.setAuth = setAuth;
  client.loadAuth = loadAuth;
  client.clearAuth = clearAuth;
  return client;
}

function getGraphQLErrorCode(error) {
  let code = get(error, 'graphQLErrors[0].extensions.code', null);

  if (!code) {
    code = get(error, 'networkError.result.errors[0].extensions.code', null);
  }

  return code;
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

    const {
      routes,
      redirects
    } = this.options;
    this.router = new Groutcho.Router({
      routes,
      redirects
    });
    this.router.onGo(this._onGo.bind(this));
    let url = '/';

    if (this.web) {
      const {
        location
      } = window;
      const {
        pathname,
        search
      } = location;
      url = `${pathname}${search}`;
      window.addEventListener('popstate', this._onPopState.bind(this));
    }

    this.logger = logger.child({
      name: 'Router',
      web: this.web
    });
    this.logger.debug('Initializing router');
    return {
      url
    };
  }

  get url() {
    return this.state.url;
  }

  match(input) {
    this.input = input;
    const match = this.router.match({ ...input,
      url: this.url
    });
    const {
      redirect,
      url
    } = match;

    if (redirect) {
      this._setUrl(url);
    }

    this.logger.debug('Router got match', {
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
      url: this.url
    });
    this.router.go(args);
  }

  back() {
    const last = this.history.pop();

    if (!last) {
      return;
    }

    this.go(last);
  }

  _setUrl(url) {
    this.logger.debug('Setting router url', url);

    if (url !== this.url) {
      const state = {
        url
      };
      this.setState(state);
      this.history.push(state);

      if (this.web) {
        window.history.pushState(state, '', url);
      }
    }
  }

  _onGo(match) {
    this.logger.debug('Router onGo called', {
      match,
      current: this.url
    });
    const {
      url
    } = match;

    if (url !== this.url) {
      this._setUrl(url);

      const {
        onGo
      } = this.options;

      if (onGo) {
        onGo(match);
      }
    }
  }

  _onPopState({
    state
  }) {
    this.setState(state);
  }

}

export { ApplicationContainer, FirebaseSession, PageContainer, Router, Session, getClient, getGraphQLErrorCode, getSubdomain, subdomainApps };
//# sourceMappingURL=index.modern.js.map
