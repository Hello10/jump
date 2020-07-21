import * as React from 'react';
import {useEffect} from 'react';
import PropTypes from 'prop-types';

import base_logger from './logger';
import PageContainer from './PageContainer';

// TODO: default loading and error views.

export default function ApplicationContainer ({
  ApplicationLoading,
  Container,
  PageLoading,
  PageError,
  client,
  useRouter,
  useSession,
  ...props
}) {
  const logger = base_logger.child('ApplicationContainer');
  logger.debug('Rendering ApplicationContainer');

  const session = useSession();
  const router = useRouter();

  useEffect(()=> {
    logger.debug('Loading session');
    session.load();
    return ()=> {
      logger.debug('Unloading session');
      session.unload();
    };
  }, []);

  const {user, loaded, error} = session;
  if (loaded) {
    logger.debug('Running router', {session, user});
    const match = router.match({user});

    if (match.redirect) {
      let msg = 'Got redirect';
      const name = match.route?.name;
      if (name) {
        msg = `${msg} to ${name}`;
      }
      logger.info(msg, {match});
    }

    return (
      <Container
        match={match}
      >
        <PageContainer
          Loading={PageLoading}
          Error={PageError}
          match={match}
          client={client}
          {...props}
        />
      </Container>
    );
  } else {
    return (
      <ApplicationLoading
        error={error}
        user={user}
        {...props}
      />
    );
  }
}

ApplicationContainer.whyDidYouRender = {
  logOnDifferentValues: true
};

ApplicationContainer.propTypes = {
  ApplicationLoading: PropTypes.func,
  Container: PropTypes.func,
  PageLoading: PropTypes.func,
  PageError: PropTypes.func,
  client: PropTypes.object,
  useRouter: PropTypes.func,
  useSession: PropTypes.func
};
