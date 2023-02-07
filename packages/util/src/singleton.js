export function singleton (args) {
  if (args && (args.constructor === Function)) {
    args = {
      Class: args
    }
  }

  if (!args || !args.Class) {
    throw new Error('Must pass constructor or object with "Class" prop')
  }

  const {
    Class,
    instance = 'instance',
    key = '_instance'
  } = args

  Class[instance] = function instance (...args) {
    if (!this[key]) {
      this[key] = new this(...args)
    }
    return this[key]
  }
}

export default singleton
