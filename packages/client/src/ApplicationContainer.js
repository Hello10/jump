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

  useEffect(()=> {
    logger.debug('Loading session');
    session.load();
    return ()=> {
      logger.debug('Unloading session');
      session.unload();
    };
  }, []);

  useEffect(()=> {
    logger.debug('Running router', {user: session.user});
    if (!session.loaded) {
      return;
    }
    const match = router.start({
      user: session.user
    });
    if (match?.redirect) {
      const {route} = match;
      let msg = 'Got redirect';
      const name = route?.name;
      if (name) {
        msg = `${msg} to ${name}`;
      }
      logger.info(msg, {match});
    }
  }, [session.user, session.loaded]);

  if (session.loaded && router.match) {
    return (
      <Container
        match={router.match}
      >
        <PageContainer
          PageLoading={PageLoading}
          PageError={PageError}
          match={router.match}
          client={client}
          user={session.user}
          {...props}
        />
      </Container>
    );
  } else {
    return (
      <ApplicationLoading
        error={session.error || router.error}
        user={session.user}
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
