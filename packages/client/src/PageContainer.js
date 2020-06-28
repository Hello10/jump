import * as React from 'react';
import {
  useEffect,
  useState
} from 'react';
import PropTypes from 'prop-types';

import debug from './debug';

export default function PageContainer ({
  Loading,
  Error,
  match,
  client
}) {
  const {params, route} = match;
  const {page: Page} = route;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(()=> {
    let unmounted = false;
    async function runQuery () {
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
        const {data} = await client.query(page_query);
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

    return ()=> {
      debug('Unmounting page container');
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
  match: PropTypes.object,
  client: PropTypes.object
};
