import Session from './Session';

export default class FirebaseSession extends Session {
  get auth () {
    return this.options.auth;
  }

  get Firebase () {
    return this.options.Firebase;
  }

  async load () {
    this.logger.debug('Loading session');

    this.setState({changing: true});

    const {SessionUser, client} = this;
    const auth = this.Firebase.auth();
    this.unsubscribe = auth.onAuthStateChanged(async (firebase_user)=> {
      this.logger.debug('Firebase auth state changed', {firebase_user});
      await this._change(async ()=> {
        let user;
        if (firebase_user) {
          this.logger.debug('Getting firebase user token');
          const token = await firebase_user.getIdToken(true);
          client.setAuth({token});
          this.logger.debug('Loading session user');
          user = await SessionUser.load({client, token, firebase_user});
        } else {
          this.logger.debug('No firebase user clearing session');
          await client.clearAuth();
          user = new SessionUser();
        }
        return {user, loaded: true};
      });
    });
  }

  async unload () {
    this.logger.debug('Unsubscribing from Firebase auth listener');
    this.unsubscribe();
  }

  async start ({
    email,
    password,
    provider: provider_name,
    popup = false
  }) {
    const provider_method = popup ? 'signInWithPopup' : 'signInWithRedirect';
    const dedicated_providers = ['Google', 'Facebook', 'Twitter', 'Github'];
    const oauth_providers = ['Yahoo', 'Microsoft', 'Apple'];

    function invalidMode () {
      throw new Error(`Invalid auth mode: ${provider_name}`);
    }

    const {Firebase, auth} = this;

    try {
      let credential;
      if (provider_name.includes('Email')) {
        if (provider_name === 'EmailSignin') {
          this.logger.debug('Signing in with email', {email});
          credential = await auth.signInWithEmailAndPassword(email, password);
        } else if (provider_name === 'EmailSignup') {
          this.logger.debug('Signing up with email', {email});
          credential = await auth.createUserWithEmailAndPassword(email, password);
          this.logger.debug('Sending session email verification');
          await credential.user.sendEmailVerification();
        } else {
          invalidMode();
        }
      } else if (dedicated_providers.includes(provider_name)) {
        const Provider = Firebase.auth[`${provider_name}AuthProvider`];
        const provider = new Provider();
        this.logger.debug('Authorizing via dedicated provider', {provider_name, provider_method});
        credential = await auth[provider_method](provider);
      } else if (oauth_providers.includes(provider_name)) {
        const domain = `${provider_name.toLowerCase()}.com`;
        const provider = new Firebase.auth.OAuthProvider(domain);
        this.logger.debug('Authorizing via OAuth provider', {domain, provider_method});
        credential = await auth[provider_method](provider);
      } else {
        invalidMode();
      }
      return credential;
    } catch (error) {
      this.logger.debug('Error authenticating', error);
      throw error;
    }
  }

  async end () {
    this.setState({changing: true});
    return this.auth.signOut();
  }
}
