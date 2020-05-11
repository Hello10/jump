import React, {
  useEffect,
  useState
} from 'react';
import PropTypes from 'prop-types';
import {useApolloClient} from '@apollo/react-hooks';

export default function PageContainer ({
  Loading,
  Error,
  match
}) {
  const client = useApolloClient();
  const {params, route} = match;
  const {page: Page} = route;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(()=> {
    let unmounted = false;
    async function runQuery () {
      if (unmounted) {
        return;
      }

      if (!Page.query) {
        setLoading(false);
        return;
      }

      try {
        const page_query = Page.query(params);
        const {data} = await client.query(page_query);
        setData(data);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    runQuery();

    return ()=> {
      unmounted = true;
    };
  }, []);

  let body;
  if (loading) {
    body = (
      <Loading/>
    );
  } else if (error) {
    body = (
      <Error error={error}/>
    );
  } else {
    body = (
      <Page
        params={params}
        route={route}
        {...data}
      />
    );
  }

  return body;
}

PageContainer.propTypes = {
  Loading: PropTypes.func,
  Error: PropTypes.func,
  match: PropTypes.object
};
