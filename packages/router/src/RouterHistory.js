import { clipper } from '@jump/util'

export class RouterHistory {
  constructor ({ web }) {
    this.web = web
    this.history = []
    this.index = -1
  }

  get current () {
    return this.entry(this.index)
  }

  get length () {
    return this.history.length
  }

  entry (index) {
    return this.history[index]
  }

  push (url) {
    const state = { url }
    this.index++
    this.history[this.index] = state
    if (this.web) {
      global.window.history.pushState(state, '', url)
    }
  }

  replace (url) {
    const state = { url }
    this.history[this.index] = state
    if (this.web) {
      global.window.history.replaceState(state, '', url)
    }
  }

  back () {
    return this.go(-1)
  }

  forward () {
    return this.go(1)
  }

  go (offset) {
    const clip = clipper({ min: 0, max: this.history.length - 1 })
    const index = clip(this.index + offset)
    this.index = index
    if (this.web) {
      global.window.history.go(offset)
    }
  }
}

export default RouterHistory