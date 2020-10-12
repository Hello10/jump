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
      console.log('calling pubsub start...');
      await this.start();

      const {json, data, attributes} = message;
      const logger = this.logger.child({
        name: 'handle',
        json,
        attributes,
        context
      });

      try {
        logger.info('Running handler');
        const args = {json, data, attributes, context};
        const response = await action.call(this, args);
        logger.info('Handler success', response);
      } catch (error) {
        logger.error('Handler failure', error);
      }
    };
  }
}
