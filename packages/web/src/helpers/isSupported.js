export function isSupported(features, object = window) {
  return features.every((feature) => feature in object)
}

export default isSupported
