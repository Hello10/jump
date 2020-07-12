import Handler from '../Handler';

export default class PubSubHandler extends Handler {
  expose (topic) {
    let actions = this.actions(topic);
    if (!Array.isArray(actions)) {
      actions = Object.entries(actions).map(([topic, action])=> {
        return {topic, action};
      });
    }

    return actions.map(({topic, action})=> {
      const handler = this.handle(action);
      return {topic, handler};
    });
  }

  handle (action) {
    return async (message, context)=> {
      await this.start();

      const {json, data, attributes} = message;
      const logger = this.logger.child({action, message, context});

      try {
        logger.info('Handler running');
        const method = this[action].bind(this);
        const response = await method({json, data, attributes, context});
        logger.info('Handler success', response);
      } catch (error) {
        logger.error('Handler failure', error);
      }
    };
  }
}
