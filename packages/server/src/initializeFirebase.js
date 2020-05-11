import Admin from 'firebase-admin';

export default function initializeFirebase ({getServiceAccount}) {
  const env = process.env.NODE_ENV;
  const service_account = getServiceAccount(env);
  const credential = Admin.credential.cert(service_account);
  const {project_id} = service_account;
  const database_url = `https://${project_id}.firebaseio.com`;

  Admin.initializeApp({
    credential,
    databaseURL: database_url
  });
}
