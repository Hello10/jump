(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('babel-polyfill'), require('react'), require('prop-types'), require('@hello10/react-hooks'), require('graphql-tag'), require('apollo-client'), require('apollo-link-context'), require('apollo-link-http'), require('apollo-cache-inmemory'), require('lodash.get'), require('groutcho')) :
  typeof define === 'function' && define.amd ? define(['exports', 'babel-polyfill', 'react', 'prop-types', '@hello10/react-hooks', 'graphql-tag', 'apollo-client', 'apollo-link-context', 'apollo-link-http', 'apollo-cache-inmemory', 'lodash.get', 'groutcho'], factory) :
  (global = global || self, factory(global.jumpClient = {}, null, global.react, global.PropTypes, global.reactHooks, global.gql, global.apolloClient, global.apolloLinkContext, global.apolloLinkHttp, global.apolloCacheInmemory, global.get, global.groutcho));
}(this, (function (exports, babelPolyfill, React, PropTypes, reactHooks, gql, apolloClient, apolloLinkContext, apolloLinkHttp, apolloCacheInmemory, get, Groutcho) {
  PropTypes = PropTypes && Object.prototype.hasOwnProperty.call(PropTypes, 'default') ? PropTypes['default'] : PropTypes;
  gql = gql && Object.prototype.hasOwnProperty.call(gql, 'default') ? gql['default'] : gql;
  get = get && Object.prototype.hasOwnProperty.call(get, 'default') ? get['default'] : get;
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

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function _extends$1() {
    _extends$1 = Object.assign || function (target) {
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

    return _extends$1.apply(this, arguments);
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

          const name = bounded(config.substr(1));
          this.excludes.push(name);
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

      const new_context = _extends$1({}, this.context, context, {
        name
      });

      const child = new this.constructor(new_context);
      child.level = this.level;
      return child;
    }

    _log(...args) {
      let body = _extends$1({}, this.context);

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
          body = _extends$1({}, body, arg);
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

  function _finallyRethrows(body, finalizer) {
    try {
      var result = body();
    } catch (e) {
      return finalizer(true, e);
    }

    if (result && result.then) {
      return result.then(finalizer.bind(null, false), finalizer.bind(null, true));
    }

    return finalizer(false, result);
  }

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
    const [last_match, setLastMatch] = React.useState(match);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [data, setData] = React.useState(null);

    if (match !== last_match) {
      logger$1.debug('Resetting for new page', {
        last_match,
        match
      });
      setLoading(true);
      setError(null);
      setData(null);
      setLastMatch(match);
    }

    logger$1.debug('Rendering page container', {
      match,
      loading,
      error,
      data
    });
    React.useEffect(() => {
      const runQuery = function () {
        try {
          if (unmounted) {
            logger$1.debug('Skip unmounted query');
            return Promise.resolve();
          }

          const _temp = _finallyRethrows(function () {
            return _catch(function () {
              const page_query = Page.query(params);
              logger$1.debug('Running query', page_query);
              return Promise.resolve(client.query(page_query)).then(function ({
                data
              }) {
                logger$1.debug('Ran query', data);
                setData(data);
              });
            }, function (error) {
              logger$1.error('Error running query', error);
              setError(error);
            });
          }, function (_wasThrown, _result) {
            logger$1.debug('Done loading');
            setLoading(false);
            if (_wasThrown) throw _result;
            return _result;
          });

          return Promise.resolve(_temp && _temp.then ? _temp.then(function () {}) : void 0);
        } catch (e) {
          return Promise.reject(e);
        }
      };

      let unmounted = false;

      if (Page.query) {
        runQuery();
      } else {
        setLoading(false);
      }

      return () => {
        logger$1.debug('Unmounting page container');
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
      return /*#__PURE__*/React.createElement(Loading, props);
    } else if (error) {
      logger$1.debug(`Rendering error for ${name}`);
      return /*#__PURE__*/React.createElement(Error, _extends({
        error: error
      }, props));
    } else {
      logger$1.debug(`Rendering loaded for ${name}`);
      return /*#__PURE__*/React.createElement(Page, _extends({
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
    const session = useSession();
    const router = useRouter();
    React.useEffect(() => {
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
        var _match$route;

        let msg = 'Got redirect';
        const name = (_match$route = match.route) == null ? void 0 : _match$route.name;

        if (name) {
          msg = `${msg} to ${name}`;
        }

        logger$1.info(msg, {
          match
        });
      }

      return /*#__PURE__*/React.createElement(Container, {
        match: match
      }, /*#__PURE__*/React.createElement(PageContainer, _extends({
        Loading: PageLoading,
        Error: PageError,
        match: match,
        client: client
      }, props)));
    } else {
      return /*#__PURE__*/React.createElement(ApplicationLoading, _extends({
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

  class Session extends reactHooks.useSingleton.Singleton {
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
              return {
                user
              };
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

      if (SessionUser.refresh) {
        this.logger.debug('No refresh method defined on SessionUser');
        return null;
      }

      this.logger.debug('Refreshing session');
      return this._change(function () {
        try {
          const {
            client
          } = _this3;
          return Promise.resolve(client.getAuth()).then(function (client_auth) {
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
              const user = new SessionUser();
              return {
                user
              };
            });
          }

          const _temp = _catch$1(function () {
            return Promise.resolve(SessionUser.end(args)).then(function () {
              _this4.logger.debug('Session ended');
            });
          }, function (error) {
            _this4.logger.error('Error ending sesssion', error);
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

        const _temp5 = _catch$1(function () {
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

  class FirebaseSession extends Session {
    get auth() {
      return this.options.auth;
    }

    get Firebase() {
      return this.options.Firebase;
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

        const auth = _this.Firebase.auth();

        _this.unsubscribe = auth.onAuthStateChanged(function (firebase_user) {
          try {
            _this.logger.debug('Firebase auth state changed', {
              firebase_user
            });

            _this._change(function () {
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
            });

            return Promise.resolve();
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
        return Promise.resolve(_catch$2(function () {
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

  function _catch$3(body, recover) {
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
  function getClient({
    uri,
    storage,
    storage_key = 'JUMP_AUTH'
  }) {
    const clearAuth = function () {
      try {
        function _temp5() {
          return writeClientAuth(NO_SESSION);
        }

        logger$1.debug('Clearing session auth');

        const _temp4 = function () {
          if (storage) {
            return Promise.resolve(writeAuthToStorage(NO_SESSION)).then(function () {});
          }
        }();

        return Promise.resolve(_temp4 && _temp4.then ? _temp4.then(_temp5) : _temp5(_temp4));
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
        return Promise.resolve(readAuthFromStorage()).then(writeClientAuth);
      } catch (e) {
        return Promise.reject(e);
      }
    };

    const setAuth = function (auth) {
      try {
        function _temp3() {
          return writeClientAuth(auth);
        }

        logger$1.debug('Setting session auth');

        const _temp2 = function () {
          if (storage) {
            return Promise.resolve(writeAuthToStorage(auth)).then(function () {});
          }
        }();

        return Promise.resolve(_temp2 && _temp2.then ? _temp2.then(_temp3) : _temp3(_temp2));
      } catch (e) {
        return Promise.reject(e);
      }
    };

    const readAuthFromStorage = function () {
      try {
        logger$1.debug('Reading auth from storage');
        let auth;

        const _temp = _catch$3(function () {
          return Promise.resolve(storage.getItem(storage_key)).then(function (json) {
            auth = JSON.parse(json) || {};
          });
        }, function () {
          auth = {};
        });

        return Promise.resolve(_temp && _temp.then ? _temp.then(function () {
          return auth;
        }) : auth);
      } catch (e) {
        return Promise.reject(e);
      }
    };

    const readClientAuth = function () {
      try {
        logger$1.debug('Getting client auth');
        const query = gql`
      {
        token @client
        refresh_token @client
      }
    `;
        return Promise.resolve(client.query({
          query
        })).then(function ({
          data
        }) {
          return data;
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };

    const logger$1 = logger.child({
      name: 'getClient',
      uri
    });
    logger$1.info('Getting client');
    const http_link = apolloLinkHttp.createHttpLink({
      uri
    });
    const auth_link = apolloLinkContext.setContext(function (request, prev_context) {
      try {
        const {
          headers = {}
        } = prev_context;
        return Promise.resolve(readClientAuth()).then(function ({
          token
        }) {
          if (token) {
            logger$1.debug('Adding auth token to header');
            headers.authorization = token ? `Bearer ${token}` : '';
          }

          return {
            headers
          };
        });
      } catch (e) {
        return Promise.reject(e);
      }
    });
    const link = auth_link.concat(http_link);
    const cache = new apolloCacheInmemory.InMemoryCache();
    const client = new apolloClient.ApolloClient({
      link,
      cache
    });
    writeClientAuth(NO_SESSION);

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

  class Router extends reactHooks.useSingleton.Singleton {
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
      const match = this.router.match(_extends({}, input, {
        url: this.url
      }));
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
      args = _extends({}, this.input, this.router._normalizeInput(args));
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
