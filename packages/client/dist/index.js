function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

require('babel-polyfill');
var reactHooks = require('@hello10/react-hooks');
var React = require('react');
var React__default = _interopDefault(React);
var client = require('@apollo/client');
var Logger = _interopDefault(require('@hello10/logger'));
var PropTypes = _interopDefault(require('prop-types'));
var context = require('@apollo/client/link/context');
var Groutcho = _interopDefault(require('groutcho'));

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

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

const logger = new Logger('jump');

const logger$1 = logger.child('PageContainer');

function Query(_ref) {
  let {
    PageLoading,
    PageError,
    Page
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, ["PageLoading", "PageError", "Page"]);

  const {
    name,
    params,
    user
  } = props;

  const _Page$query = Page.query({
    params,
    user
  }),
        {
    query: query_gql
  } = _Page$query,
        options = _objectWithoutPropertiesLoose(_Page$query, ["query"]);

  const query = client.useQuery(query_gql, options);
  const {
    loading,
    error,
    data
  } = query;
  logger$1.debug('Rendering page container query', _extends({}, props, {
    loading,
    error,
    data
  }));

  if (loading) {
    logger$1.debug(`Rendering loading for ${name}`);
    return /*#__PURE__*/React.createElement(PageLoading, _extends({
      Page: Page,
      query: query
    }, props));
  } else if (error) {
    logger$1.debug(`Rendering error for ${name}`);
    return /*#__PURE__*/React.createElement(PageError, _extends({
      Page: Page,
      error: error,
      query: query
    }, props));
  } else {
    logger$1.debug(`Rendering loaded for ${name}`);
    return /*#__PURE__*/React.createElement(Page, _extends({
      data: data,
      query: query
    }, props));
  }
}

function PageContainer(props) {
  const {
    route,
    params
  } = props.match;
  const {
    page: Page,
    name
  } = route;
  const page_props = {
    route,
    params,
    name
  };

  if (!Page) {
    throw new Error('Page not found in route');
  }

  if (Page.query) {
    return /*#__PURE__*/React.createElement(Query, _extends({
      Page: Page
    }, props, page_props));
  } else {
    return /*#__PURE__*/React.createElement(Page, _extends({
      data: {},
      query: null
    }, props, page_props));
  }
}

function ApplicationContainer(_ref) {
  let {
    ApplicationLoading,
    Container,
    PageLoading,
    PageError,
    client,
    useRouter,
    useSession
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, ["ApplicationLoading", "Container", "PageLoading", "PageError", "client", "useRouter", "useSession"]);

  const logger$1 = logger.child('ApplicationContainer');
  logger$1.debug('Rendering ApplicationContainer');
  const router = useRouter();
  const session = useSession();
  React.useEffect(() => {
    logger$1.debug('Loading session');
    session.load();
    return () => {
      logger$1.debug('Unloading session');
      session.unload();
    };
  }, []);
  React.useEffect(() => {
    logger$1.debug('Running router', {
      user: session.user
    });

    if (!session.loaded) {
      return;
    }

    const match = router.start({
      user: session.user
    });

    if (match != null && match.redirect) {
      const {
        route
      } = match;
      let msg = 'Got redirect';
      const name = route == null ? void 0 : route.name;

      if (name) {
        msg = `${msg} to ${name}`;
      }

      logger$1.info(msg, {
        match
      });
    }
  }, [session.user, session.loaded]);

  if (session.loaded && router.match) {
    return /*#__PURE__*/React__default.createElement(Container, {
      match: router.match
    }, /*#__PURE__*/React__default.createElement(PageContainer, _extends({
      PageLoading: PageLoading,
      PageError: PageError,
      match: router.match,
      client: client,
      user: session.user
    }, props)));
  } else {
    return /*#__PURE__*/React__default.createElement(ApplicationLoading, _extends({
      error: session.error || router.error,
      user: session.user
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

async function mapp(iterable, map, options = {}) {
  let concurrency = options.concurrency || Infinity;
  let index = 0;
  const results = [];
  const runs = [];
  const iterator = iterable[Symbol.iterator]();
  const sentinel = Symbol('sentinel');

  while (concurrency-- > 0) {
    const r = run();

    if (r === sentinel) {
      break;
    } else {
      runs.push(r);
    }
  }

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

  return Promise.all(runs).then(() => results);
}
var mapp_1 = mapp;

const NO_SESSION = {
  token: null,
  refresh_token: null
};
class Session extends reactHooks.useSingleton.Singleton {
  initialize() {
    const {
      Firebase,
      SessionUser,
      client,
      storage,
      storage_key = 'JUMP_AUTH',
      shouldEndSessionOnError = () => {
        return true;
      }
    } = this.options;
    client.session = this;
    SessionUser.client = client;
    const user = new SessionUser();
    this.Firebase = Firebase;
    this.SessionUser = SessionUser;
    this.client = client;
    this.storage = storage;
    this.storage_key = storage_key;
    this.shouldEndSessionOnError = shouldEndSessionOnError;
    this.logger = logger.child({
      name: 'Session',
      user
    });
    this.auth = null;

    if (!storage) {
      this.logger.info('Client session storage is disabled');
    }

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
    this.logger.debug('Loading session');
    return this._change(async () => {
      this.auth = await this.readAuth();
      const user = await this.SessionUser.load();
      this.logger.debug('Session loaded', {
        user
      });
      return {
        user,
        loaded: true
      };
    });
  }

  getToken() {
    var _this$auth;

    return (_this$auth = this.auth) == null ? void 0 : _this$auth.token;
  }

  unload() {}

  start(args) {
    this.logger.debug('Starting session');
    return this._change(async () => {
      const {
        user,
        auth
      } = await this.SessionUser.start(args);
      this.logger.debug('Session started, setting auth', {
        user
      });
      await this.writeAuth(auth);
      await this.apps(app => {
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
    const {
      SessionUser
    } = this;

    if (!SessionUser.refresh) {
      this.logger.debug('No refresh method defined on SessionUser');
      return null;
    }

    this.logger.debug('Refreshing session');
    return this._change(async () => {
      const data = await SessionUser.refresh(this.auth);
      const {
        user,
        auth
      } = data;
      this.logger.debug('Session refreshed', {
        user
      });
      await this.writeAuth(auth);
      return {
        user
      };
    });
  }

  end(args) {
    const {
      SessionUser
    } = this;
    this.logger.debug('Ending session');
    return this._change(async () => {
      await SessionUser.end(args);
      await this.apps(app => {
        app.auth().signOut();
      });
      const user = new SessionUser();
      await this.clearAuth();
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
      this.setState(_extends({
        changing: false,
        error: null
      }, state));
    } catch (error) {
      this.logger.error('Session error', {
        error
      });
      let {
        user
      } = this;

      if (this.shouldEndSessionOnError(error)) {
        this.logger.debug('Clearing session on error');
        await this.clearAuth();
        user = new this.SessionUser();
      }

      this.setState({
        changing: false,
        user,
        error
      });
    }
  }

  async writeAuth(auth) {
    this.auth = auth;
    const {
      storage,
      storage_key
    } = this;

    if (storage) {
      logger.debug('Writing auth to storage');
      const json = JSON.stringify(auth);
      await storage.setItem(storage_key, json);
    }
  }

  async readAuth() {
    const {
      storage,
      storage_key
    } = this;
    let auth = null;

    if (storage) {
      logger.debug('Reading auth from storage');

      try {
        const json = await storage.getItem(storage_key);
        auth = JSON.parse(json);
      } catch (error) {
        this.logger.error('Error loading session form storage', {
          error
        });
      }
    }

    return auth || NO_SESSION;
  }

  async clearAuth() {
    this.auth = NO_SESSION;
    const {
      storage,
      storage_key
    } = this;

    if (storage) {
      logger.debug('Clearing auth from storage');
      await storage.removeItem(storage_key);
    }
  }

}

class FirebaseSession extends Session {
  get auth() {
    return this.Firebase.auth();
  }

  async load() {
    this.logger.debug('Loading session');
    this.setState({
      changing: true
    });
    const {
      SessionUser,
      client
    } = this;
    this.unsubscribe = this.auth.onIdTokenChanged(async firebase_user => {
      this.logger.debug('Firebase auth state changed', {
        firebase_user
      });
      await this._change(async () => {
        let user;

        if (firebase_user) {
          this.logger.debug('Getting firebase user token');
          const token = await firebase_user.getIdToken(true);
          this.logger.debug('Loading session user');
          user = await SessionUser.load({
            client,
            token,
            firebase_user
          });
        } else {
          this.logger.debug('No firebase user clearing session');
          user = new SessionUser();
        }

        return {
          user,
          loaded: true
        };
      });
    });
  }

  getToken() {
    var _this$auth$currentUse;

    return (_this$auth$currentUse = this.auth.currentUser) == null ? void 0 : _this$auth$currentUse.getIdToken(true);
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
    const {
      SessionUser
    } = this;
    this.logger.debug('Ending session');
    return this._change(async () => {
      await this.auth.signOut();
      return {
        user: new SessionUser()
      };
    });
  }

}

function getClient({
  uri,
  options = {},
  cache_options = {}
}) {
  const logger$1 = logger.child({
    name: 'getClient',
    uri
  });
  logger$1.info('Getting client');
  const http_link = new client.HttpLink({
    uri
  });
  let client$1;
  const auth_link = context.setContext(async (request, prev_context) => {
    const {
      headers = {}
    } = prev_context;
    const {
      session
    } = client$1;

    if (session) {
      const token = await session.getToken();

      if (token) {
        logger$1.debug('Adding auth token to header');
        headers.authorization = token ? `Bearer ${token}` : '';
      }
    }

    return {
      headers
    };
  });
  const link = client.from([auth_link, http_link]);
  const cache = new client.InMemoryCache(cache_options);
  client$1 = new client.ApolloClient({
    link,
    cache,
    defaultOptions: options
  });
  return client$1;
}

function getGraphQLErrorCode(error) {
  var _error, _error$extensions;

  if (error.graphQLErrors) {
    [error] = error.graphQLErrors;
  }

  return (_error = error) == null ? void 0 : (_error$extensions = _error.extensions) == null ? void 0 : _error$extensions.code;
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

class Router extends reactHooks.useSingleton.Singleton {
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
    var _this$match;

    return (_this$match = this.match) == null ? void 0 : _this$match.url;
  }

  get error() {
    return this.state.error;
  }

  get match() {
    return this.state.match;
  }

  get route() {
    var _this$match2;

    return (_this$match2 = this.match) == null ? void 0 : _this$match2.route;
  }

  get params() {
    var _this$match3;

    return (_this$match3 = this.match) == null ? void 0 : _this$match3.params;
  }

  get page() {
    var _this$route;

    return (_this$route = this.route) == null ? void 0 : _this$route.page;
  }

  get input() {
    return this.state.input;
  }

  start(_ref) {
    let {
      url
    } = _ref,
        input = _objectWithoutPropertiesLoose(_ref, ["url"]);

    this.logger.debug('Router start', {
      url,
      input
    });

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

    const match = this.router.match(_extends({}, input, {
      url
    }));

    this._handleMatch({
      match,
      input
    });

    return match;
  }

  go(args) {
    args = _extends({}, this.input, this.router._normalizeInput(args));
    this.logger.debug('Router go', {
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
      }

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
    const match = this.router.match(_extends({}, input, {
      url
    }));

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

Object.keys(reactHooks).forEach(function (k) {
  if (k !== 'default') Object.defineProperty(exports, k, {
    enumerable: true,
    get: function () {
      return reactHooks[k];
    }
  });
});
exports.ApplicationContainer = ApplicationContainer;
exports.FirebaseSession = FirebaseSession;
exports.PageContainer = PageContainer;
exports.Router = Router;
exports.Session = Session;
exports.getClient = getClient;
exports.getGraphQLErrorCode = getGraphQLErrorCode;
exports.getSubdomain = getSubdomain;
exports.subdomainApps = subdomainApps;
//# sourceMappingURL=index.js.map
