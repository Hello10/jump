import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';

import base_logger from './logger';
import PageContainer from './PageContainer';

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
  const [match, setMatch] = useState(null);
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
    logger.debug('Running router', {session, user});
    const match = router.match({user});
    const {route, redirect} = match;
    if (redirect) {
      let msg = 'Got redirect';
      const name = route?.name;
      if (name) {
        msg = `${msg} to ${name}`;
      }
      logger.info(msg, {match});
    }
    setMatch(match);
  }, [user, router.url]);

  if (match && session.loaded) {
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
        error={session.error}
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
