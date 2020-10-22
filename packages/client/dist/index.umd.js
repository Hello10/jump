(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('babel-polyfill'), require('@hello10/react-hooks'), require('react'), require('@apollo/client'), require('@hello10/logger'), require('prop-types'), require('@apollo/client/link/context'), require('groutcho')) :
  typeof define === 'function' && define.amd ? define(['exports', 'babel-polyfill', '@hello10/react-hooks', 'react', '@apollo/client', '@hello10/logger', 'prop-types', '@apollo/client/link/context', 'groutcho'], factory) :
  (global = global || self, factory(global.jumpClient = {}, null, global.reactHooks, global.react, global.client, global.Logger, global.PropTypes, global.context, global.groutcho));
}(this, (function (exports, babelPolyfill, reactHooks, React, client, Logger, PropTypes, context, Groutcho) {
  var React__default = 'default' in React ? React['default'] : React;
  Logger = Logger && Object.prototype.hasOwnProperty.call(Logger, 'default') ? Logger['default'] : Logger;
  PropTypes = PropTypes && Object.prototype.hasOwnProperty.call(PropTypes, 'default') ? PropTypes['default'] : PropTypes;
  Groutcho = Groutcho && Object.prototype.hasOwnProperty.call(Groutcho, 'default') ? Groutcho['default'] : Groutcho;

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
      Loading,
      Error,
      Page
    } = _ref,
        props = _objectWithoutPropertiesLoose(_ref, ["Loading", "Error", "Page"]);

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
      return /*#__PURE__*/React.createElement(Loading, _extends({
        Page: Page,
        query: query
      }, props));
    } else if (error) {
      logger$1.debug(`Rendering error for ${name}`);
      return /*#__PURE__*/React.createElement(Error, _extends({
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
    const {
      user
    } = session;
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
        user
      });

      if (!session.loaded) {
        return;
      }

      const match = router.start({
        user
      });

      if (match == null ? void 0 : match.redirect) {
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
    }, [user]);

    if (session.loaded && router.match) {
      return /*#__PURE__*/React__default.createElement(Container, {
        match: router.match
      }, /*#__PURE__*/React__default.createElement(PageContainer, _extends({
        Loading: PageLoading,
        Error: PageError,
        match: router.match,
        client: client,
        user: user
      }, props)));
    } else {
      return /*#__PURE__*/React__default.createElement(ApplicationLoading, _extends({
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
  var mapp_1 = mapp;

  function _catch(body, recover) {
    try {
      var result = body();
    } catch (e) {
      return recover(e);
    }

    if (result && result.then) {
      return result.then(void 0, recover);
    }

    return result;
  }

  class Session extends reactHooks.useSingleton.Singleton {
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

    load() {
      try {
        const _this = this;

        _this.logger.debug('Loading session');

        return Promise.resolve(_this._change(function () {
          try {
            return Promise.resolve(_this.client.loadAuth()).then(function () {
              return Promise.resolve(_this.SessionUser.load()).then(function (user) {
                _this.logger.debug('Session loaded', {
                  user
                });

                return {
                  user,
                  loaded: true
                };
              });
            });
          } catch (e) {
            return Promise.reject(e);
          }
        }));
      } catch (e) {
        return Promise.reject(e);
      }
    }

    unload() {}

    start(args) {
      const _this2 = this;

      this.logger.debug('Starting session');
      return this._change(function () {
        try {
          return Promise.resolve(_this2.SessionUser.start(args)).then(function ({
            user,
            auth
          }) {
            _this2.logger.debug('Session started, setting auth', {
              user
            });

            return Promise.resolve(_this2.client.setAuth(auth)).then(function () {
              return Promise.resolve(_this2.apps(app => {
                const app_token = auth.app_tokens.find(({
                  name
                }) => name === app.name);

                if (!app_token) {
                  return null;
                }

                return app.auth().signInWithCustomToken(app_token.token);
              })).then(function () {
                return {
                  user
                };
              });
            });
          });
        } catch (e) {
          return Promise.reject(e);
        }
      });
    }

    refresh() {
      const _this3 = this;

      const {
        SessionUser
      } = this;

      if (!SessionUser.refresh) {
        this.logger.debug('No refresh method defined on SessionUser');
        return null;
      }

      this.logger.debug('Refreshing session');
      return this._change(function () {
        try {
          const {
            client
          } = _this3;
          return Promise.resolve(client.loadAuth()).then(function (client_auth) {
            return Promise.resolve(SessionUser.refresh(client_auth)).then(function (data) {
              const {
                user,
                auth
              } = data;

              _this3.logger.debug('Session refreshed, setting auth', {
                user
              });

              return Promise.resolve(client.setAuth(auth)).then(function () {
                return {
                  user
                };
              });
            });
          });
        } catch (e) {
          return Promise.reject(e);
        }
      });
    }

    end(args) {
      const _this4 = this;

      const {
        SessionUser
      } = this;
      this.logger.debug('Ending session');
      return this._change(function () {
        try {
          function _temp2() {
            return Promise.resolve(_this4.client.clearAuth()).then(function () {
              return Promise.resolve(_this4.apps(app => {
                app.auth().signOut();
              })).then(function () {
                const user = new SessionUser();
                return {
                  user
                };
              });
            });
          }

          const _temp = _catch(function () {
            return Promise.resolve(SessionUser.end(args)).then(function () {
              _this4.logger.debug('Session ended');
            });
          }, function (error) {
            _this4.logger.error('Error ending session', error);
          });

          return Promise.resolve(_temp && _temp.then ? _temp.then(_temp2) : _temp2(_temp));
        } catch (e) {
          return Promise.reject(e);
        }
      });
    }

    _change(action) {
      try {
        const _this5 = this;

        if (!_this5.changing) {
          _this5.setState({
            changing: true
          });
        }

        const _temp5 = _catch(function () {
          return Promise.resolve(action()).then(function (state) {
            _this5.setState(_extends({
              changing: false,
              error: null
            }, state));
          });
        }, function (error) {
          function _temp4() {
            _this5.setState({
              changing: false,
              user,
              error
            });
          }

          _this5.logger.error('Session error', {
            error
          });

          let {
            user
          } = _this5;

          const _temp3 = function () {
            if (_this5.shouldEndSessionOnError(error)) {
              _this5.logger.debug('Clearing session on error');

              return Promise.resolve(_this5.client.clearAuth()).then(function () {
                user = null;
              });
            }
          }();

          return _temp3 && _temp3.then ? _temp3.then(_temp4) : _temp4(_temp3);
        });

        return Promise.resolve(_temp5 && _temp5.then ? _temp5.then(function () {}) : void 0);
      } catch (e) {
        return Promise.reject(e);
      }
    }

  }

  function _catch$1(body, recover) {
    try {
      var result = body();
    } catch (e) {
      return recover(e);
    }

    if (result && result.then) {
      return result.then(void 0, recover);
    }

    return result;
  }

  class FirebaseSession extends Session {
    get auth() {
      return this.Firebase.auth();
    }

    load() {
      try {
        const _this = this;

        _this.logger.debug('Loading session');

        _this.setState({
          changing: true
        });

        const {
          SessionUser,
          client
        } = _this;
        _this.unsubscribe = _this.auth.onAuthStateChanged(function (firebase_user) {
          try {
            _this.logger.debug('Firebase auth state changed', {
              firebase_user
            });

            return Promise.resolve(_this._change(function () {
              try {
                function _temp2() {
                  return {
                    user,
                    loaded: true
                  };
                }

                let user;

                const _temp = function () {
                  if (firebase_user) {
                    _this.logger.debug('Getting firebase user token');

                    return Promise.resolve(firebase_user.getIdToken(true)).then(function (token) {
                      client.setAuth({
                        token
                      });

                      _this.logger.debug('Loading session user');

                      return Promise.resolve(SessionUser.load({
                        client,
                        token,
                        firebase_user
                      })).then(function (_SessionUser$load) {
                        user = _SessionUser$load;
                      });
                    });
                  } else {
                    _this.logger.debug('No firebase user clearing session');

                    return Promise.resolve(client.clearAuth()).then(function () {
                      user = new SessionUser();
                    });
                  }
                }();

                return Promise.resolve(_temp && _temp.then ? _temp.then(_temp2) : _temp2(_temp));
              } catch (e) {
                return Promise.reject(e);
              }
            })).then(function () {});
          } catch (e) {
            return Promise.reject(e);
          }
        });
        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    }

    unload() {
      try {
        const _this2 = this;

        _this2.logger.debug('Unsubscribing from Firebase auth listener');

        _this2.unsubscribe();

        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    }

    start({
      email,
      password,
      provider: provider_name,
      popup = false
    }) {
      try {
        const _this3 = this;

        const provider_method = popup ? 'signInWithPopup' : 'signInWithRedirect';
        const dedicated_providers = ['Google', 'Facebook', 'Twitter', 'Github'];

        function invalidMode() {
          throw new Error(`Invalid auth mode: ${provider_name}`);
        }

        const oauth_providers = ['Yahoo', 'Microsoft', 'Apple'];
        const {
          Firebase,
          auth
        } = _this3;
        return Promise.resolve(_catch$1(function () {
          let credential;

          const _temp7 = function () {
            if (provider_name.includes('Email')) {
              const _temp4 = function () {
                if (provider_name === 'EmailSignin') {
                  _this3.logger.debug('Signing in with email', {
                    email
                  });

                  return Promise.resolve(auth.signInWithEmailAndPassword(email, password)).then(function (_auth$signInWithEmail) {
                    credential = _auth$signInWithEmail;
                  });
                } else {
                  const _temp3 = function () {
                    if (provider_name === 'EmailSignup') {
                      _this3.logger.debug('Signing up with email', {
                        email
                      });

                      return Promise.resolve(auth.createUserWithEmailAndPassword(email, password)).then(function (_auth$createUserWithE) {
                        credential = _auth$createUserWithE;

                        _this3.logger.debug('Sending session email verification');

                        return Promise.resolve(credential.user.sendEmailVerification()).then(function () {});
                      });
                    } else {
                      invalidMode();
                    }
                  }();

                  if (_temp3 && _temp3.then) return _temp3.then(function () {});
                }
              }();

              if (_temp4 && _temp4.then) return _temp4.then(function () {});
            } else {
              const _temp6 = function () {
                if (dedicated_providers.includes(provider_name)) {
                  const Provider = Firebase.auth[`${provider_name}AuthProvider`];
                  const provider = new Provider();

                  _this3.logger.debug('Authorizing via dedicated provider', {
                    provider_name,
                    provider_method
                  });

                  return Promise.resolve(auth[provider_method](provider)).then(function (_auth$provider_method) {
                    credential = _auth$provider_method;
                  });
                } else {
                  const _temp5 = function () {
                    if (oauth_providers.includes(provider_name)) {
                      const domain = `${provider_name.toLowerCase()}.com`;
                      const provider = new Firebase.auth.OAuthProvider(domain);

                      _this3.logger.debug('Authorizing via OAuth provider', {
                        domain,
                        provider_method
                      });

                      return Promise.resolve(auth[provider_method](provider)).then(function (_auth$provider_method2) {
                        credential = _auth$provider_method2;
                      });
                    } else {
                      invalidMode();
                    }
                  }();

                  if (_temp5 && _temp5.then) return _temp5.then(function () {});
                }
              }();

              if (_temp6 && _temp6.then) return _temp6.then(function () {});
            }
          }();

          return _temp7 && _temp7.then ? _temp7.then(function () {
            return credential;
          }) : credential;
        }, function (error) {
          _this3.logger.debug('Error authenticating', error);

          throw error;
        }));
      } catch (e) {
        return Promise.reject(e);
      }
    }

    end() {
      try {
        const _this4 = this;

        _this4.setState({
          changing: true
        });

        return Promise.resolve(_this4.auth.signOut());
      } catch (e) {
        return Promise.reject(e);
      }
    }

  }

  function _catch$2(body, recover) {
    try {
      var result = body();
    } catch (e) {
      return recover(e);
    }

    if (result && result.then) {
      return result.then(void 0, recover);
    }

    return result;
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
    const clearAuth = function () {
      try {
        logger$1.debug('Clearing session auth');
        setAuth(NO_SESSION);
        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    };

    const loadAuth = function () {
      try {
        if (!storage) {
          throw new Error('No storage specified to load auth from');
        }

        logger$1.debug('Loading session auth');
        return Promise.resolve(readAuthFromStorage()).then(function (_readAuthFromStorage) {
          auth = _readAuthFromStorage;
          return auth;
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };

    const setAuth = function (new_auth) {
      try {
        function _temp5() {
          auth = new_auth;
        }

        logger$1.debug('Setting session auth');

        const _temp4 = function () {
          if (storage) {
            return Promise.resolve(writeAuthToStorage(new_auth)).then(function () {});
          }
        }();

        return Promise.resolve(_temp4 && _temp4.then ? _temp4.then(_temp5) : _temp5(_temp4));
      } catch (e) {
        return Promise.reject(e);
      }
    };

    const readAuthFromStorage = function () {
      try {
        logger$1.debug('Reading auth from storage');
        let auth;

        const _temp3 = _catch$2(function () {
          return Promise.resolve(storage.getItem(storage_key)).then(function (json) {
            auth = JSON.parse(json) || NO_SESSION;
          });
        }, function () {
          auth = NO_SESSION;
        });

        return Promise.resolve(_temp3 && _temp3.then ? _temp3.then(function () {
          return auth;
        }) : auth);
      } catch (e) {
        return Promise.reject(e);
      }
    };

    const logger$1 = logger.child({
      name: 'getClient',
      uri
    });
    logger$1.info('Getting client');
    const http_link = new client.HttpLink({
      uri
    });
    const auth_link = context.setContext(function (request, prev_context) {
      try {
        function _temp2() {
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
        }

        const {
          headers = {}
        } = prev_context;

        const _temp = function () {
          if (!auth) {
            return Promise.resolve(loadAuth()).then(function () {});
          }
        }();

        return Promise.resolve(_temp && _temp.then ? _temp.then(_temp2) : _temp2(_temp));
      } catch (e) {
        return Promise.reject(e);
      }
    });
    const link = client.from([auth_link, http_link]);
    const cache = new client.InMemoryCache(cache_options);
    const client$1 = new client.ApolloClient({
      link,
      cache,
      defaultOptions: options
    });

    function writeAuthToStorage(auth) {
      logger$1.debug('Writing auth to storage');
      const json = JSON.stringify(auth);
      return storage.setItem(storage_key, json);
    }

    client$1.setAuth = setAuth;
    client$1.loadAuth = loadAuth;
    client$1.clearAuth = clearAuth;
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

})));
//# sourceMappingURL=index.umd.js.map
