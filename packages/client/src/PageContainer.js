import * as React from 'react';
import {useQuery} from '@apollo/client';

import base_logger from './logger';

const logger = base_logger.child('PageContainer');

function Query ({Loading, Error, Page, ...page_props}) {
  const {name, params, user} = page_props;
  const {query: query_gql, ...options} = Page.query({params, user});
  const query = useQuery(query_gql, options);

  const {loading, error, data} = query;
  logger.debug('Rendering page container query', {...page_props, loading, error, data});

  if (loading) {
    logger.debug(`Rendering loading for ${name}`);
    return (
      <Loading
        Page={Page}
        query={query}
        {...page_props}
      />
    );
  } else if (error) {
    logger.debug(`Rendering error for ${name}`);
    return (
      <Error
        Page={Page}
        error={error}
        query={query}
        {...page_props}
      />
    );
  } else {
    logger.debug(`Rendering loaded for ${name}`);
    return (
      <Page
        data={data}
        query={query}
        {...page_props}
      />
    );
  }
}

export function PageContainer ({
  Loading,
  Error,
  match,
  user
}) {
  const {route, params} = match;
  const {page: Page, name} = route;

  const page_props = {match, route, params, user, name};

  if (Page.query) {
    return (
      <Query
        Loading={Loading}
        Error={Error}
        Page={Page}
        {...page_props}
      />
    );
  } else {
    return (
      <Page
        data={{}}
        query={null}
        {...page_props}
      />
    );
  }
}
