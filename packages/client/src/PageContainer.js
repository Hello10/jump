import * as React from 'react';
import {
  useEffect,
  useState
} from 'react';
import PropTypes from 'prop-types';

import base_logger from './logger';

export default function PageContainer ({
  Loading,
  Error,
  match,
  client
}) {
  const {params, route} = match;
  const {page: Page, name} = route;

  const logger = base_logger.child('PageContainer');

  const [last_match, setLastMatch] = useState(match);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Check whether the page changed
  if (match !== last_match) {
    logger.debug('Resetting for new page', {last_match, match});
    setLoading(true);
    setError(null);
    setData(null);
    setLastMatch(match);
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
        const page_query = Page.query(params);
        logger.debug('Running query', page_query);
        const {data} = await client.query(page_query);
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

    if (Page.query) {
      runQuery();
    } else {
      setLoading(false);
    }

    return ()=> {
      logger.debug('Unmounting page container');
      unmounted = true;
    };
  }, [match]);

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
        {...data}
      />
    );
  }
}

PageContainer.propTypes = {
  Loading: PropTypes.func,
  Error: PropTypes.func,
  match: PropTypes.object,
  client: PropTypes.object
};
