import Admin from 'firebase-admin';

import {AuthTokenError} from './Errors';

export default async function getUserIdFromToken (token) {
  try {
    const auth = Admin.auth();
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    const {code, message} = error;
    throw new AuthTokenError({code, message});
  }
}
