import {
  ApolloClient,
  from,
  HttpLink,
  InMemoryCache
} from '@apollo/client';
import {setContext} from '@apollo/client/link/context';

import base_logger from './logger';

const NO_SESSION = {
  token: null,
  refresh_token: null
};

let auth = null;

export default function getClient ({
  uri,
  storage,
  storage_key = 'JUMP_AUTH',
  options = {},
  cache_options = {}
}) {
  const logger = base_logger.child({name: 'getClient', uri});

  logger.info('Getting client');

  const http_link = new HttpLink({uri});

  const auth_link = setContext(async (request, prev_context)=> {
    const {headers = {}} = prev_context;
    if (!auth) {
      await loadAuth();
    }
    const {token} = auth;
    if (token) {
      logger.debug('Adding auth token to header');
      headers.authorization = token ? `Bearer ${token}` : '';
    }
    return {headers};
  });

  const link = from([auth_link, http_link]);
  const cache = new InMemoryCache(cache_options);
  const client = new ApolloClient({link, cache, defaultOptions: options});

  function writeAuthToStorage (auth) {
    logger.debug('Writing auth to storage');
    const json = JSON.stringify(auth);
    return storage.setItem(storage_key, json);
  }

  async function readAuthFromStorage () {
    logger.debug('Reading auth from storage');
    let auth;
    try {
      const json = await storage.getItem(storage_key);
      auth = JSON.parse(json) || NO_SESSION;
    } catch (error) {
      auth = NO_SESSION;
    }
    return auth;
  }

  async function setAuth (new_auth) {
    logger.debug('Setting session auth');
    if (storage) {
      await writeAuthToStorage(new_auth);
    }
    auth = new_auth;
  }

  async function loadAuth () {
    if (!storage) {
      throw new Error('No storage specified to load auth from');
    }
    logger.debug('Loading session auth');
    auth = await readAuthFromStorage();
    return auth;
  }

  async function clearAuth () {
    logger.debug('Clearing session auth');
    setAuth(NO_SESSION);
  }

  client.setAuth = setAuth;
  client.loadAuth = loadAuth;
  client.clearAuth = clearAuth;

  return client;
}
