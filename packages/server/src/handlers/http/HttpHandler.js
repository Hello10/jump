import Handler from '../Handler';

export default class HttpHandler extends Handler {
  expose (app) {
    let actions = this.actions();
    if (!Array.isArray(actions)) {
      actions = Object.entries(actions).map(([route, action])=> {
        if (!route.includes(' ')) {
          route = `GET ${route}`;
        }
        const [method, path] = route.split(/\s+/);
        return {method, path, action};
      });
    }

    for (const {method, path, action} of actions) {
      const fn = method.toLowerCase();
      app[fn](path, this.handle(action));
    }

    return app;
  }

  handle (action) {
    return async (request, response)=> {
      await this.start();

      const {params} = request;
      const logger = this.logger.child({action, params});

      try {
        logger.info('Calling handler');
        const method = this[action].bind(this);
        const data = await method({params, request, response});
        logger.info('Handler success', {data});
        return response.json(data);
      } catch (error) {
        logger.error('Handler failure', error);
        return response
          .status(error.status || 500)
          .json({error: error.message});
      }
    };
  }
}
