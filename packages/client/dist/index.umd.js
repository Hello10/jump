(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('babel-polyfill'), require('react'), require('prop-types'), require('firebase/app'), require('firebase/auth'), require('lodash.get'), require('graphql-tag'), require('apollo-client'), require('apollo-link-context'), require('apollo-link-http'), require('apollo-cache-inmemory')) :
  typeof define === 'function' && define.amd ? define(['exports', 'babel-polyfill', 'react', 'prop-types', 'firebase/app', 'firebase/auth', 'lodash.get', 'graphql-tag', 'apollo-client', 'apollo-link-context', 'apollo-link-http', 'apollo-cache-inmemory'], factory) :
  (global = global || self, factory(global.jumpClient = {}, null, global.react, global.PropTypes, global.Firebase, null, global.get, global.gql, global.apolloClient, global.apolloLinkContext, global.apolloLinkHttp, global.apolloCacheInmemory));
}(this, (function (exports, babelPolyfill, React, PropTypes, Firebase, auth, get, gql, apolloClient, apolloLinkContext, apolloLinkHttp, apolloCacheInmemory) {
  PropTypes = PropTypes && Object.prototype.hasOwnProperty.call(PropTypes, 'default') ? PropTypes['default'] : PropTypes;
  Firebase = Firebase && Object.prototype.hasOwnProperty.call(Firebase, 'default') ? Firebase['default'] : Firebase;
  get = get && Object.prototype.hasOwnProperty.call(get, 'default') ? get['default'] : get;
  gql = gql && Object.prototype.hasOwnProperty.call(gql, 'default') ? gql['default'] : gql;

  function getGraphQLErrorCode(error) {
    let code = get(error, 'graphQLErrors[0].extensions.code', null);

    if (!code) {
      code = get(error, 'networkError.result.errors[0].extensions.code', null);
    }

    return code;
  }

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

  const SessionContext = React.createContext();

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

  function SessionProvider({
    client,
    children,
    SessionUser,
    Loading,
    popup = true
  }) {
    const start = function ({
      email,
      password,
      provider: provider_name
    }) {
      try {
        const auth = Firebase.auth();
        const provider_method = popup ? 'signInWithPopup' : 'signInWithRedirect';
        const dedicated_providers = ['Google', 'Facebook', 'Twitter', 'Github'];

        function invalidMode() {}

        const oauth_providers = ['Yahoo', 'Microsoft', 'Apple'];
        let result;

        const _temp5 = function () {
          if (provider_name.includes('Email')) {
            let action;

            if (provider_name === 'EmailSignin') {
              action = 'signInWithEmailAndPassword';
            } else if (provider_name === 'EmailSignup') {
              action = 'createUserWithEmailAndPassword';
            } else {
              invalidMode();
            }

            return Promise.resolve(auth[action](email, password)).then(function (_auth$action) {
              result = _auth$action;

              const _temp2 = function () {
                if (action === 'createUserWithEmailAndPassword') {
                  return Promise.resolve(auth.currentUser.sendEmailVerification()).then(function (_auth$currentUser$sen) {
                    result = _auth$currentUser$sen;
                  });
                }
              }();

              if (_temp2 && _temp2.then) return _temp2.then(function () {});
            });
          } else {
            const _temp4 = function () {
              if (dedicated_providers.includes(provider_name)) {
                const Provider = Firebase.auth[`${provider_name}AuthProvider`];
                const provider = new Provider();
                return Promise.resolve(auth[provider_method](provider)).then(function (_auth$provider_method) {
                  result = _auth$provider_method;
                });
              } else {
                const _temp3 = function () {
                  if (oauth_providers.includes(provider_name)) {
                    const domain = `${provider_name.toLowerCase()}.com`;
                    const provider = new Firebase.auth.OAuthProvider(domain);
                    return Promise.resolve(auth[provider_method](provider)).then(function (_auth$provider_method2) {
                      result = _auth$provider_method2;
                    });
                  } else {
                    invalidMode();
                  }
                }();

                if (_temp3 && _temp3.then) return _temp3.then(function () {});
              }
            }();

            if (_temp4 && _temp4.then) return _temp4.then(function () {});
          }
        }();

        return Promise.resolve(_temp5 && _temp5.then ? _temp5.then(function () {
          return result;
        }) : result);
      } catch (e) {
        return Promise.reject(e);
      }
    };

    const [loaded, setLoaded] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [user, _setUser] = React.useState(new SessionUser(null));

    function setUser(data) {
      const user = new SessionUser(data);

      _setUser(user);
    }

    React.useEffect(() => {
      const auth = Firebase.auth();
      const unsubscribe = auth.onAuthStateChanged(function (firebase_user) {
        try {
          return Promise.resolve(_finallyRethrows(function () {
            return _catch(function () {
              const _temp = function () {
                if (firebase_user) {
                  return Promise.resolve(firebase_user.getIdToken(true)).then(function (token) {
                    client.setToken(token);
                    return Promise.resolve(SessionUser.load({
                      client,
                      token,
                      firebase_user
                    })).then(function (user) {
                      setUser(user);
                    });
                  });
                } else {
                  client.clearToken();
                  setUser(null);
                }
              }();

              if (_temp && _temp.then) return _temp.then(function () {});
            }, function (error) {
              const code = getGraphQLErrorCode(error);

              if (code) {
                setError(code);
              } else {
                setError('Session error');
              }
            });
          }, function (_wasThrown, _result) {
            setLoaded(true);
            if (_wasThrown) throw _result;
            return _result;
          }));
        } catch (e) {
          return Promise.reject(e);
        }
      });
      return () => {
        unsubscribe();
      };
    }, []);

    function end() {
      return Firebase.auth().signOut();
    }

    function reload() {}

    let $body;

    if (loaded) {
      $body = children({
        user
      });
    } else {
      $body = /*#__PURE__*/React.createElement(Loading, {
        user: user,
        error: error,
        reload: reload
      });
    }

    return /*#__PURE__*/React.createElement(SessionContext.Provider, {
      value: {
        loaded,
        error,
        user,
        start,
        reload,
        end
      }
    }, $body);
  }

  SessionProvider.propTypes = {
    children: PropTypes.func,
    client: PropTypes.object,
    SessionUser: PropTypes.func,
    Loading: PropTypes.func,
    popup: PropTypes.bool
  };
  const {
    Consumer: SessionConsumer
  } = SessionContext;

  function useSession() {
    return React.useContext(SessionContext);
  }

  function useSessionUser() {
    const session = useSession();
    return session.user;
  }

  function getClient({
    uri
  }) {
    const getToken = function () {
      try {
        const query = gql`
      {
        token @client
      }
    `;
        return Promise.resolve(client.query({
          query
        })).then(function ({
          data
        }) {
          return data.token;
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };

    const http_link = apolloLinkHttp.createHttpLink({
      uri
    });
    const auth_link = apolloLinkContext.setContext(function (request, prev_context) {
      try {
        const {
          headers = {}
        } = prev_context;
        return Promise.resolve(getToken()).then(function (token) {
          if (token) {
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

    function setToken(token) {
      return client.writeData({
        data: {
          token
        }
      });
    }

    function clearToken() {
      return setToken(null);
    }

    client.setToken = setToken;
    client.clearToken = clearToken;
    clearToken();
    return client;
  }

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

  function _finallyRethrows$1(body, finalizer) {
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
      page: Page
    } = route;
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [data, setData] = React.useState(null);
    React.useEffect(() => {
      const runQuery = function () {
        try {
          if (unmounted) {
            return Promise.resolve();
          }

          if (!Page.query) {
            setLoading(false);
            return Promise.resolve();
          }

          const _temp = _finallyRethrows$1(function () {
            return _catch$1(function () {
              const page_query = Page.query(params);
              return Promise.resolve(client.query(page_query)).then(function ({
                data
              }) {
                setData(data);
              });
            }, function (error) {
              setError(error);
            });
          }, function (_wasThrown, _result) {
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
      runQuery();
      return () => {
        unmounted = true;
      };
    }, []);
    let body;

    if (loading) {
      body = /*#__PURE__*/React.createElement(Loading, null);
    } else if (error) {
      body = /*#__PURE__*/React.createElement(Error, {
        error: error
      });
    } else {
      body = /*#__PURE__*/React.createElement(Page, _extends({
        params: params,
        route: route
      }, data));
    }

    return body;
  }
  PageContainer.propTypes = {
    Loading: PropTypes.func,
    Error: PropTypes.func,
    match: PropTypes.object,
    client: PropTypes.object
  };

  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  };

  exports.PageContainer = PageContainer;
  exports.SessionConsumer = SessionConsumer;
  exports.SessionContext = SessionContext;
  exports.SessionProvider = SessionProvider;
  exports.firebaseConfig = config;
  exports.getClient = getClient;
  exports.getGraphQLErrorCode = getGraphQLErrorCode;
  exports.useSession = useSession;
  exports.useSessionUser = useSessionUser;

})));
//# sourceMappingURL=index.umd.js.map
