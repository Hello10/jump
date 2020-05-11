import getUserIdFromToken from './getUserIdFromToken';

export default function contextBuilder ({Collections, getToken, user_collection}) {
  return async ({req})=> {
    const loaders = {};
    function getLoader (arg) {
      const name = arg.name || arg;
      if (!(name in loaders)) {
        const collection = getCollection(name);
        loaders[name] = collection.loader;
      }
      return loaders[name];
    }

    function getCollection (arg) {
      const name = arg.name || arg;
      const Collection = Collections[name];
      if (!Collection) {
        throw new Error(`Collection with name ${name} does not exist`);
      }

      return Collection.get({
        getCollection,
        getLoader
      });
    }

    let user_id = null;
    let user = null;
    let auth_error = null;

    const token = getToken(req);
    if (token) {
      try {
        const User = getCollection(user_collection);
        user_id = await getUserIdFromToken(token);
        user = await User.get({id: user_id});
      } catch (error) {
        auth_error = error;
      }
    }

    return {
      getCollection,
      getLoader,
      auth_error,
      token,
      user_id,
      user
    };
  };
}
