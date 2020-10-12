import React, {useEffect} from 'react';
import PropTypes from 'prop-types';

import base_logger from './logger';
import {PageContainer} from './PageContainer';

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

  const router = useRouter();
  const session = useSession();
  const {user} = session;

  useEffect(()=> {
    logger.debug('Loading session');
    session.load();
    return ()=> {
      logger.debug('Unloading session');
      session.unload();
    };
  }, []);

  useEffect(()=> {
    logger.debug('Running router', {user});
    if (!session.loaded) {
      return;
    }
    const match = router.start({user});
    if (match?.redirect) {
      const {route} = match;
      let msg = 'Got redirect';
      const name = route?.name;
      if (name) {
        msg = `${msg} to ${name}`;
      }
      logger.info(msg, {match});
    }
  }, [user]);

  if (session.loaded && router.match) {
    return (
      <Container
        match={router.match}
      >
        <PageContainer
          Loading={PageLoading}
          Error={PageError}
          match={router.match}
          client={client}
          {...props}
        />
      </Container>
    );
  } else {
    return (
      <ApplicationLoading
        error={session.error || router.error}
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
