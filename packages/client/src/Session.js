import {mapp} from '@hello10/util';
import {useSingleton} from '@hello10/react-hooks';

import logger from './logger';

const NO_SESSION = {
  token: null,
  refresh_token: null
};

export default class Session extends useSingleton.Singleton {
  initialize () {
    const {
      Firebase,
      SessionUser,
      client,
      storage,
      storage_key = 'JUMP_AUTH',
      shouldEndSessionOnError = ()=> {
        return true;
      }
    } = this.options;

    client.session = this;
    SessionUser.client = client;
    const user = new SessionUser();

    this.Firebase = Firebase;
    this.SessionUser = SessionUser;
    this.client = client;
    this.storage = storage;
    this.storage_key = storage_key;
    this.shouldEndSessionOnError = shouldEndSessionOnError;

    this.logger = logger.child({
      name: 'Session',
      user
    });

    this._auth = null;

    if (!storage) {
      this.logger.info('Client session storage is disabled');
    }

    return {
      user,
      changing: false,
      loaded: false,
      error: null
    };
  }

  get auth () {
    return this._auth;
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
      this._auth = await this.readAuth();
      const user = await this.SessionUser.load();
      this.logger.debug('Session loaded', {user});
      return {
        user,
        loaded: true
      };
    });
  }

  getToken () {
    return this._auth?.token;
  }

  unload () {}

  start (args) {
    this.logger.debug('Starting session');
    return this._change(async ()=> {
      const {user, auth} = await this.SessionUser.start(args);
      this.logger.debug('Session started, setting auth', {user});
      await this.writeAuth(auth);
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
      const data = await SessionUser.refresh(this._auth);
      const {user, auth} = data;
      this.logger.debug('Session refreshed', {user});
      await this.writeAuth(auth);
      return {user};
    });
  }

  end (args) {
    const {SessionUser} = this;
    this.logger.debug('Ending session');
    return this._change(async ()=> {
      await SessionUser.end(args);
      await this.apps((app)=> {
        app.auth().signOut();
      });
      const user = new SessionUser();
      await this.clearAuth();
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
        await this.clearAuth();
        user = new this.SessionUser();
      }
      this.setState({
        changing: false,
        user,
        error
      });
    }
  }

  async writeAuth (auth) {
    this._auth = auth;
    const {storage, storage_key} = this;
    if (storage) {
      logger.debug('Writing auth to storage');
      const json = JSON.stringify(auth);
      await storage.setItem(storage_key, json);
    }
  }

  async readAuth () {
    const {storage, storage_key} = this;
    let auth = null;
    if (storage) {
      logger.debug('Reading auth from storage');
      try {
        const json = await storage.getItem(storage_key);
        auth = JSON.parse(json);
      } catch (error) {
        this.logger.error('Error loading session form storage', {error});
      }
    }
    return auth || NO_SESSION;
  }

  async clearAuth () {
    this._auth = NO_SESSION;
    const {storage, storage_key} = this;
    if (storage) {
      logger.debug('Clearing auth from storage');
      await storage.removeItem(storage_key);
    }
  }
}
