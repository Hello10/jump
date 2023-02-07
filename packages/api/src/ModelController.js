import { get, capitalize } from '@jump/util'

import Controller from './Controller'

export class ModelController extends Controller {
  get model () {
    return this.getModel(this.name)
  }

  getModel (name) {
    return this.models[name]
  }

  load ({ model, path }) {
    return (request) => {
      const loader = request.context.getLoader(model)
      const id = get(request, path)
      return id ? loader.load(id) : null
    }
  }

  loadMany ({ model, path }) {
    return (request) => {
      const loader = request.context.getLoader(model)
      const ids = get(request, path)
      return ids.length ? loader.loadMany(ids) : []
    }
  }

  polyRef ({ obj, info, context }) {
    const { fieldName: name } = info
    const type = obj[`${name}_type`]
    const id = obj[`${name}_id`]
    if (!(type && id)) {
      return null
    }
    const Loader = context.getLoader(type)
    return Loader.load(id)
  }

  /// ////////////////////
  // Generic Resolvers //
  /// ////////////////////

  exists = this._toModel('exists')
  list = this._toModel('list')
  create = this._aroundToModel('create')
  update = this._aroundToModel('update')
  delete = this._aroundToModel('delete')

  get = this.load({
    collection: this.name,
    path: 'args.id'
  })

  _toModel (method) {
    return (request) => {
      return this.model[method](request.args)
    }
  }

  _aroundToModel (method) {
    const cmethod = capitalize(method)
    const before = `before${cmethod}`
    const after = `after${cmethod}`

    return async (request) => {
      const { args = {} } = request

      let { data } = args
      if (this[before]) {
        data = await this[before]({ ...request, data })
      }

      let result = await this.model[method]({ ...args, data })
      if (this[after]) {
        const res = await this[after]({ ...request, data, result })
        if (res !== undefined) {
          result = res
        }
      }

      return result
    }
  }
}

export default ModelController
