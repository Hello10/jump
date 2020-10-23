import * as React from 'react';
import {useQuery} from '@apollo/client';

import base_logger from './logger';

const logger = base_logger.child('PageContainer');

function Query ({PageLoading, PageError, Page, ...props}) {
  const {name, params, user} = props;
  const {query: query_gql, ...options} = Page.query({params, user});
  const query = useQuery(query_gql, options);
  const {loading, error, data} = query;

  logger.debug('Rendering page container query', {...props, loading, error, data});

  if (loading) {
    logger.debug(`Rendering loading for ${name}`);
    return (
      <PageLoading
        Page={Page}
        query={query}
        {...props}
      />
    );
  } else if (error) {
    logger.debug(`Rendering error for ${name}`);
    return (
      <PageError
        Page={Page}
        error={error}
        query={query}
        {...props}
      />
    );
  } else {
    logger.debug(`Rendering loaded for ${name}`);
    return (
      <Page
        data={data}
        query={query}
        {...props}
      />
    );
  }
}

export function PageContainer (props) {
  const {route, params} = props.match;
  const {page: Page, name} = route;
  const page_props = {route, params, name};

  if (!Page) {
    throw new Error('Page not found in route');
  }

  if (Page.query) {
    return (
      <Query
        Page={Page}
        {...props}
        {...page_props}
      />
    );
  } else {
    return (
      <Page
        data={{}}
        query={null}
        {...props}
        {...page_props}
      />
    );
  }
}
