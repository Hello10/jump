import gql from 'graphql-tag';
import {ApolloClient} from 'apollo-client';
import {setContext} from 'apollo-link-context';
import {createHttpLink} from 'apollo-link-http';
import {InMemoryCache} from 'apollo-cache-inmemory';

import base_logger from './logger';

const NO_SESSION = {
  token: null,
  refresh_token: null
};

export default function getClient ({uri, storage, storage_key = 'JUMP_AUTH'}) {
  const logger = base_logger.child({name: 'getClient', uri});

  logger.info('Getting client');

  const http_link = createHttpLink({uri});

  const auth_link = setContext(async (request, prev_context)=> {
    const {headers = {}} = prev_context;
    const {token} = await readClientAuth();
    if (token) {
      logger.debug('Adding auth token to header');
      headers.authorization = token ? `Bearer ${token}` : '';
    }
    return {headers};
  });

  const link = auth_link.concat(http_link);
  const cache = new InMemoryCache();
  const client = new ApolloClient({link, cache});
  writeClientAuth(NO_SESSION);

  async function readClientAuth () {
    logger.debug('Getting client auth');
    const query = gql`
      {
        token @client
        refresh_token @client
      }
    `;
    const {data} = await client.query({query});
    return data;
  }

  function writeClientAuth (auth) {
    logger.debug('Setting client auth');
    return client.writeData({data: auth});
  }

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
      auth = JSON.parse(json) || {};
    } catch (error) {
      auth = {};
    }
    return auth;
  }

  async function setAuth (auth) {
    logger.debug('Setting session auth');
    if (storage) {
      await writeAuthToStorage(auth);
    }
    return writeClientAuth(auth);
  }

  async function loadAuth () {
    if (!storage) {
      throw new Error('No storage specified to load auth from');
    }
    logger.debug('Loading session auth');
    const auth = await readAuthFromStorage();
    return writeClientAuth(auth);
  }

  async function clearAuth () {
    logger.debug('Clearing session auth');
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
