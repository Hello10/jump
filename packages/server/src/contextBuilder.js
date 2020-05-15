export default function contextBuilder ({Admin, app, Collections, getToken, loadUserFromToken}) {
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
        Admin,
        app,
        getCollection,
        getLoader
      });
    }

    let user_id = null;
    let user = null;
    let load_user_error = null;

    const token = getToken(req);
    if (token) {
      try {
        ({user_id, user} = await loadUserFromToken({token, getCollection}));
      } catch (error) {
        load_user_error = error;
      }
    }

    return {
      Admin,
      app,
      getCollection,
      getLoader,
      token,
      user_id,
      user,
      load_user_error
    };
  };
}
