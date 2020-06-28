import gql from 'graphql-tag';
import {ApolloClient} from 'apollo-client';
import {setContext} from 'apollo-link-context';
import {createHttpLink} from 'apollo-link-http';
import {InMemoryCache} from 'apollo-cache-inmemory';

import debug from './debug';

export default function getClient ({uri}) {
  debug(`Getting client with uri ${uri}`);

  const http_link = createHttpLink({uri});

  const auth_link = setContext(async (request, prev_context)=> {
    const {headers = {}} = prev_context;
    const token = await getToken();
    if (token) {
      debug('Adding auth token to header');
      headers.authorization = token ? `Bearer ${token}` : '';
    }
    return {headers};
  });

  const link = auth_link.concat(http_link);
  const cache = new InMemoryCache();
  const client = new ApolloClient({link, cache});

  async function getToken () {
    debug('Getting auth token');
    const query = gql`
      {
        token @client
      }
    `;
    const {data} = await client.query({query});
    return data.token;
  }

  function setToken (token) {
    debug('Setting auth token');
    return client.writeData({data: {token}});
  }

  function clearToken () {
    debug('Clearing auth token');
    return setToken(null);
  }

  client.setToken = setToken;
  client.clearToken = clearToken;

  clearToken();
  return client;
}
