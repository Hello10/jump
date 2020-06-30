import 'babel-polyfill';
import { createContext, useState, useEffect, createElement, useContext } from 'react';
import PropTypes from 'prop-types';
import Firebase from 'firebase/app';
import 'firebase/auth';
import get from 'lodash.get';
import makeDebug from 'debug';
import gql from 'graphql-tag';
import { ApolloClient } from 'apollo-client';
import { setContext } from 'apollo-link-context';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { useSingleton } from '@hello10/react-hooks';
import { Router } from 'groutcho';

function getGraphQLErrorCode(error) {
  let code = get(error, 'graphQLErrors[0].extensions.code', null);

  if (!code) {
    code = get(error, 'networkError.result.errors[0].extensions.code', null);
  }

  return code;
}

const debug = makeDebug('jump');

const SessionContext = createContext();

function SessionProvider({
  client,
  children,
  SessionUser,
  Loading,
  popup = true
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [user, _setUser] = useState(new SessionUser(null));

  function setUser(data) {
    debug('Setting session user', data);
    const user = new SessionUser(data);

    _setUser(user);
  }

  useEffect(() => {
    const auth = Firebase.auth();
    const unsubscribe = auth.onAuthStateChanged(async firebase_user => {
      debug('Firebase auth state changed', firebase_user);

      try {
        if (firebase_user) {
          debug('Getting firebase user token');
          const token = await firebase_user.getIdToken(true);
          client.setToken(token);
          debug('Loading session user');
          const user = await SessionUser.load({
            client,
            token,
            firebase_user
          });
          setUser(user);
        } else {
          client.clearToken();
          setUser(null);
        }
      } catch (error) {
        debug('Session error', error);
        const code = getGraphQLErrorCode(error);

        if (code) {
          setError(code);
        } else {
          setError('Session error');
        }
      } finally {
        debug('Session loaded');
        setLoaded(true);
      }
    });
    return () => {
      debug('Unsubscribing from firebase auth state listener');
      unsubscribe();
    };
  }, []);

  async function start({
    email,
    password,
    provider: provider_name
  }) {
    debug('Starting session', email, provider_name);
    const auth = Firebase.auth();
    const provider_method = popup ? 'signInWithPopup' : 'signInWithRedirect';
    const dedicated_providers = ['Google', 'Facebook', 'Twitter', 'Github'];
    const oauth_providers = ['Yahoo', 'Microsoft', 'Apple'];

    function invalidMode() {
      throw new Error(`Invalid auth mode: ${provider_name}`);
    }

    try {
      let result;

      if (provider_name.includes('Email')) {
        let action;

        if (provider_name === 'EmailSignin') {
          action = 'signInWithEmailAndPassword';
        } else if (provider_name === 'EmailSignup') {
          action = 'createUserWithEmailAndPassword';
        } else {
          invalidMode();
        }

        debug('Authorizing via email', {
          action,
          email
        });
        result = await auth[action](email, password).then(ok => {
          console.log('honk', ok);
          return ok;
        }).catch(error => {
          console.error('dat error', error);
          throw error;
        });

        if (action === 'createUserWithEmailAndPassword') {
          debug('Sending session email verification');
          result = await auth.currentUser.sendEmailVerification();
        }
      } else if (dedicated_providers.includes(provider_name)) {
        const Provider = Firebase.auth[`${provider_name}AuthProvider`];
        const provider = new Provider();
        debug('Authorizing via dedicated provider', {
          provider_name,
          provider_method
        });
        result = await auth[provider_method](provider);
      } else if (oauth_providers.includes(provider_name)) {
        const domain = `${provider_name.toLowerCase()}.com`;
        const provider = new Firebase.auth.OAuthProvider(domain);
        debug('Authorizing via OAuth provider', {
          domain,
          provider_method
        });
        result = await auth[provider_method](provider);
      } else {
        invalidMode();
      }

      return result;
    } catch (error) {
      debug('Error authenticating', error);
      throw error;
    }
  }

  function end() {
    debug('Signing out');
    return Firebase.auth().signOut();
  }

  function reload() {}

  let $body;

  if (loaded) {
    $body = children({
      user
    });
  } else {
    $body = /*#__PURE__*/createElement(Loading, {
      user: user,
      error: error,
      reload: reload
    });
  }

  return /*#__PURE__*/createElement(SessionContext.Provider, {
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
  return useContext(SessionContext);
}

function useSessionUser() {
  const session = useSession();
  return session.user;
}

let _ = t => t,
    _t;
function getClient({
  uri
}) {
  debug(`Getting client with uri ${uri}`);
  const http_link = createHttpLink({
    uri
  });
  const auth_link = setContext(async (request, prev_context) => {
    const {
      headers = {}
    } = prev_context;
    const token = await getToken();

    if (token) {
      debug('Adding auth token to header');
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

  async function getToken() {
    debug('Getting auth token');
    const query = gql(_t || (_t = _`
      {
        token @client
      }
    `));
    const {
      data
    } = await client.query({
      query
    });
    return data.token;
  }

  function setToken(token) {
    debug('Setting auth token');
    return client.writeData({
      data: {
        token
      }
    });
  }

  function clearToken() {
    debug('Clearing auth token');
    return setToken(null);
  }

  client.setToken = setToken;
  client.clearToken = clearToken;
  clearToken();
  return client;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  useEffect(() => {
    let unmounted = false;

    async function runQuery() {
      if (unmounted) {
        debug('Skipping unmounted query');
        return;
      }

      if (!Page.query) {
        debug('No query defined');
        setLoading(false);
        return;
      }

      try {
        const page_query = Page.query(params);
        debug('Running query', page_query);
        const {
          data
        } = await client.query(page_query);
        debug('Ran query', data);
        setData(data);
      } catch (error) {
        debug('Error running query', error);
        setError(error);
      } finally {
        debug('Done loading');
        setLoading(false);
      }
    }

    runQuery();
    return () => {
      debug('Unmounting page container');
      unmounted = true;
    };
  }, []);
  let body;

  if (loading) {
    body = /*#__PURE__*/createElement(Loading, null);
  } else if (error) {
    body = /*#__PURE__*/createElement(Error, {
      error: error
    });
  } else {
    body = /*#__PURE__*/createElement(Page, Object.assign({
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

class SingletonRouter extends useSingleton.Singleton {
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
    this.router = new Router({
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

    return {
      url
    };
  }

  get url() {
    return this.state.url;
  }

  match(input) {
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

    return match;
  }

  go(args) {
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
    const state = {
      url
    };
    this.setState(state);
    this.history.push(state);

    if (this.web) {
      window.history.pushState(state, '', url);
    }
  }

  _onGo(new_url) {
    if (new_url !== this.url) {
      this._setUrl(new_url);

      const {
        onGo
      } = this.options;

      if (onGo) {
        onGo(new_url);
      }
    }
  }

  _onPopState({
    state
  }) {
    this.setState(state);
  }

}

function useRouter(options = {}) {
  return useSingleton(SingletonRouter, options);
}

export { PageContainer, SessionConsumer, SessionContext, SessionProvider, config as firebaseConfig, getClient, getGraphQLErrorCode, getSubdomain, subdomainApps, useRouter, useSession, useSessionUser };
//# sourceMappingURL=index.modern.js.map
