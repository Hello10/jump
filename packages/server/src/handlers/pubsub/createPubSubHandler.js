import processOptions from '../processOptions';

export default function createPubSubHandler ({Handler, options}) {
  options = processOptions(options.handler);
  const handler = new Handler(options);
  return handler.expose();
}
