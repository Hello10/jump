import {mapp} from '@hello10/util';
import {useSingleton} from '@hello10/react-hooks';

import logger from './logger';

export default class Session extends useSingleton.Singleton {
  initialize () {
    const {
      Firebase,
      SessionUser,
      client,
      shouldEndSessionOnError = ()=> {
        return true;
      }
    } = this.options;

    SessionUser.client = client;
    const user = new SessionUser();

    this.Firebase = Firebase;
    this.SessionUser = SessionUser;
    this.client = client;
    this.shouldEndSessionOnError = shouldEndSessionOnError;

    this.logger = logger.child({
      name: 'Session',
      user
    });

    return {
      user,
      changing: false,
      loaded: false,
      error: null
    };
  }

  get user () {
    return this.state.user;
  }

  set user (data) {
    const user = new this.SessionUser(data);
    this.setState({user});
  }

  get changing () {
    return this.state.changing;
  }

  get loaded () {
    return this.state.loaded;
  }

  get error () {
    return this.state.error;
  }

  get load_error () {
    return this.loaded ? null : this.error;
  }

  apps (fn) {
    return mapp(this.Firebase.apps, fn);
  }

  async load () {
    this.logger.debug('Loading session');
    return this._change(async ()=> {
      await this.client.loadAuth();
      const user = await this.SessionUser.load();
      this.logger.debug('Session loaded', {user});
      return {
        user,
        loaded: true
      };
    });
  }

  unload () {}

  start (args) {
    this.logger.debug('Starting session');
    return this._change(async ()=> {
      const {user, auth} = await this.SessionUser.start(args);
      this.logger.debug('Session started, setting auth', {user});
      await this.client.setAuth(auth);
      await this.apps((app)=> {
        const app_token = auth.app_tokens.find(({name})=> name === app.name);
        if (!app_token) {
          return null;
        }
        return app.auth().signInWithCustomToken(app_token.token);
      });
      return {user};
    });
  }

  refresh () {
    const {SessionUser} = this;
    if (!SessionUser.refresh) {
      this.logger.debug('No refresh method defined on SessionUser');
      return null;
    }

    this.logger.debug('Refreshing session');
    return this._change(async ()=> {
      const {client} = this;
      const client_auth = await client.loadAuth();
      const data = await SessionUser.refresh(client_auth);
      const {user, auth} = data;
      this.logger.debug('Session refreshed, setting auth', {user});
      await client.setAuth(auth);
      return {user};
    });
  }

  end (args) {
    const {SessionUser} = this;
    this.logger.debug('Ending session');
    return this._change(async ()=> {
      try {
        await SessionUser.end(args);
        this.logger.debug('Session ended');
      } catch (error) {
        this.logger.error('Error ending session', error);
      }
      await this.client.clearAuth();
      await this.apps((app)=> {
        app.auth().signOut();
      });
      const user = new SessionUser();
      return {user};
    });
  }

  async _change (action) {
    if (!this.changing) {
      this.setState({changing: true});
    }

    try {
      const state = await action();
      this.setState({
        changing: false,
        error: null,
        ...state
      });
    } catch (error) {
      this.logger.error('Session error', {error});
      let {user} = this;
      if (this.shouldEndSessionOnError(error)) {
        this.logger.debug('Clearing session on error');
        await this.client.clearAuth();
        user = null;
      }
      this.setState({
        changing: false,
        user,
        error
      });
    }
  }
}
