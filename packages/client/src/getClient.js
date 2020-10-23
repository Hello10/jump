import {
  ApolloClient,
  from,
  HttpLink,
  InMemoryCache
} from '@apollo/client';
import {setContext} from '@apollo/client/link/context';

import base_logger from './logger';

export default function getClient ({
  uri,
  options = {},
  cache_options = {}
}) {
  const logger = base_logger.child({name: 'getClient', uri});

  logger.info('Getting client');

  const http_link = new HttpLink({uri});

  let client;

  const auth_link = setContext(async (request, prev_context)=> {
    const {headers = {}} = prev_context;
    const {session} = client;
    if (session) {
      const token = await session.getToken();
      if (token) {
        logger.debug('Adding auth token to header');
        headers.authorization = token ? `Bearer ${token}` : '';
      }
    }
    return {headers};
  });

  const link = from([auth_link, http_link]);
  const cache = new InMemoryCache(cache_options);
  client = new ApolloClient({link, cache, defaultOptions: options});

  return client;
}
