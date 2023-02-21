import React, { useState, useEffect } from 'react'

export class Singleton {
  constructor (options = {}) {
    if (this.constructor.instance) {
      throw new Error("Don't call singleton constructor directly")
    }

    this.options = options
    this.listeners = []
    this.state = this.initialize(options)
  }

  initialize ({ state = {} } = {}) {
    return state
  }

  setState (state) {
    this.state = {
      ...this.state,
      ...state
    }

    for (const listener of this.listeners) {
      listener(this.state)
    }
  }

  addListener (listener) {
    this.listeners.push(listener)
  }

  removeListener (listener) {
    this.listeners = this.listeners.filter((l) => l !== listener)
  }
}

const map = new Map()

export function useSingleton (Class, options = {}) {
  let instance = map.get(Class)

  const [_, setState] = useState()

  useEffect(() => {
    let isMounted = true
    function setStateIfMounted (state) {
      if (isMounted) {
        setState(state)
      }
    }

    instance?.addListener(setStateIfMounted)
    return () => {
      isMounted = false
      instance?.removeListener(setStateIfMounted)
    }
  }, [Class])

  if (!instance) {
    instance = new Class(options)
    map.set(Class, instance)
  }

  return instance
}

export default useSingleton