import gql from 'graphql-tag';
import {ApolloClient} from 'apollo-client';
import {setContext} from 'apollo-link-context';
import {createHttpLink} from 'apollo-link-http';
import {InMemoryCache} from 'apollo-cache-inmemory';

export default function getClient ({uri}) {
  const http_link = createHttpLink({uri});

  const auth_link = setContext(async (request, prev_context)=> {
    const {headers = {}} = prev_context;
    const token = await getToken();
    if (token) {
      headers.authorization = token ? `Bearer ${token}` : '';
    }
    return {headers};
  });

  const link = auth_link.concat(http_link);
  const cache = new InMemoryCache();
  const client = new ApolloClient({link, cache});

  async function getToken () {
    const query = gql`
      {
        token @client
      }
    `;
    const {data} = await client.query({query});
    return data.token;
  }

  function setToken (token) {
    return client.writeData({data: {token}});
  }

  function clearToken () {
    return setToken(null);
  }

  client.setToken = setToken;
  client.clearToken = clearToken;

  clearToken();
  return client;
}
