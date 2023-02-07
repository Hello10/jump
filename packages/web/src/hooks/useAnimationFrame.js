import React, { useRef } from 'react'

export function useAnimationFrame (tick) {
  const { requestAnimationFrame, cancelAnimationFrame } = global.window

  const request = useRef()
  const lastTime = useRef()
  const firstTime = useRef()

  const stopper = Symbol('stop')

  function animate (time) {
    let first = firstTime.current
    if (first === undefined) {
      firstTime.current = time
      first = time
    }

    const last = lastTime.current
    if (last !== undefined) {
      const delta = time - last
      const total = time - first
      tick({ delta, total })
    }

    lastTime.current = time
    if (request.current !== stopper) {
      request.current = requestAnimationFrame(animate)
    }
  }

  function stop() {
    const { current } = request
    if (current && current !== stopper) {
      cancelAnimationFrame(current)
    }
    request.current = stopper
  }

  React.useEffect(() => {
    request.current = requestAnimationFrame(animate)
    return () => {
      stop()
    }
  }, [])

  return {
    stop
  }
}
