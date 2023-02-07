import { useReducer } from 'react'

export function useStateBlob (initial) {
  return useReducer((state, delta) => {
    return {
      ...state,
      ...delta
    }
  }, initial)
}
