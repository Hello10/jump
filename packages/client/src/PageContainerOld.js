import * as React from 'react';
import {
  useEffect,
  useState
} from 'react';
import PropTypes from 'prop-types';
import deepEqual from 'deep-equal';

import base_logger from './logger';

function getQueryAndPage ({user, match}) {
  if (!match) {
    return {};
  }
  const {params, route} = match;
  const {page} = route;
  let query = null;
  if (page.query) {
    query = page.query({params, user});
  }
  return {query, page};
}

export function PageContainer ({
  Loading,
  Error,
  match,
  client,
  user
}) {
  const logger = base_logger.child('PageContainer');

  const [last_match, setLastMatch] = useState(match);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const {query, page} = getQueryAndPage({match, user});

  let run_query = true;
  // Check whether the page changed
  if (last_match && (match !== last_match)) {
    const {
      query: last_query,
      page: last_page
    }  = getQueryAndPage({match: last_match, user});

    const page_changed = (page !== last_page);
    const query_changed = !deepEqual(query, last_query);

    run_query = (page_changed || query_changed);

    if (run_query) {
      logger.debug('Resetting for new query', {last_match, match});
      setLoading(true);
      setError(null);
      setData(null);
      setLastMatch(match);
    }
  }

  logger.debug('Rendering page container', {match, loading, error, data});

  useEffect(()=> {
    let unmounted = false;

    async function runQuery () {
      if (unmounted) {
        logger.debug('Skip unmounted query');
        return;
      }

      try {
        logger.debug('Running query', query);
        const {data} = await client.query(query);
        logger.debug('Ran query', data);
        setData(data);
      } catch (error) {
        logger.error('Error running query', error);
        setError(error);
      } finally {
        logger.debug('Done loading');
        setLoading(false);
      }
    }

    if (query && run_query) {
      runQuery();
    } else {
      setLoading(false);
    }

    return ()=> {
      logger.debug('Unmounting page container');
      unmounted = true;
    };
  }, [match]);

  const {params, route} = match;
  const {page: Page, name} = route;
  const props = {Page, match, route, params};

  if (loading) {
    logger.debug(`Rendering loading for ${name}`);
    return (
      <Loading {...props} />
    );
  } else if (error) {
    logger.debug(`Rendering error for ${name}`);
    return (
      <Error
        error={error}
        {...props}
      />
    );
  } else {
    logger.debug(`Rendering loaded for ${name}`);
    return (
      <Page
        match={match}
        params={params}
        route={route}
        data={data}
      />
    );
  }
}

export const PagePropTypes = {
  match: PropTypes.object,
  params: PropTypes.object,
  route: PropTypes.object,
  data: PropTypes.object
};

PageContainer.propTypes = {
  Loading: PropTypes.func,
  Error: PropTypes.func,
  match: PropTypes.object,
  client: PropTypes.object,
  user: PropTypes.object
};
