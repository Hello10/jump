import 'babel-polyfill';
import { createContext, useState, useEffect, createElement, useContext } from 'react';
import PropTypes from 'prop-types';
import Firebase from 'firebase/app';
import 'firebase/auth';
import get from 'lodash.get';
import gql from 'graphql-tag';
import { ApolloClient } from 'apollo-client';
import { setContext } from 'apollo-link-context';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

function getGraphQLErrorCode(error) {
  let code = get(error, 'graphQLErrors[0].extensions.code', null);

  if (!code) {
    code = get(error, 'networkError.result.errors[0].extensions.code', null);
  }

  return code;
}

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
    const user = new SessionUser(data);

    _setUser(user);
  }

  useEffect(() => {
    const auth = Firebase.auth();
    const unsubscribe = auth.onAuthStateChanged(async firebase_user => {
      try {
        if (firebase_user) {
          const token = await firebase_user.getIdToken(true);
          client.setToken(token);
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
        const code = getGraphQLErrorCode(error);

        if (code) {
          setError(code);
        } else {
          setError('Session error');
        }
      } finally {
        setLoaded(true);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  async function start({
    email,
    password,
    provider: provider_name
  }) {
    const auth = Firebase.auth();
    const provider_method = popup ? 'signInWithPopup' : 'signInWithRedirect';
    const dedicated_providers = ['Google', 'Facebook', 'Twitter', 'Github'];
    const oauth_providers = ['Yahoo', 'Microsoft', 'Apple'];

    let result;

    if (provider_name.includes('Email')) {
      let action;

      if (provider_name === 'EmailSignin') {
        action = 'signInWithEmailAndPassword';
      } else if (provider_name === 'EmailSignup') {
        action = 'createUserWithEmailAndPassword';
      }

      result = await auth[action](email, password);

      if (action === 'createUserWithEmailAndPassword') {
        result = await auth.currentUser.sendEmailVerification();
      }
    } else if (dedicated_providers.includes(provider_name)) {
      const Provider = Firebase.auth[`${provider_name}AuthProvider`];
      const provider = new Provider();
      result = await auth[provider_method](provider);
    } else if (oauth_providers.includes(provider_name)) {
      const domain = `${provider_name.toLowerCase()}.com`;
      const provider = new Firebase.auth.OAuthProvider(domain);
      result = await auth[provider_method](provider);
    }

    return result;
  }

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
  const http_link = createHttpLink({
    uri
  });
  const auth_link = setContext(async (request, prev_context) => {
    const {
      headers = {}
    } = prev_context;
    const token = await getToken();

    if (token) {
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
        return;
      }

      if (!Page.query) {
        setLoading(false);
        return;
      }

      try {
        const page_query = Page.query(params);
        const {
          data
        } = await client.query(page_query);
        setData(data);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    runQuery();
    return () => {
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

export { PageContainer, SessionConsumer, SessionContext, SessionProvider, config as firebaseConfig, getClient, getGraphQLErrorCode, useSession, useSessionUser };
//# sourceMappingURL=index.modern.js.map
