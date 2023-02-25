import React from 'react'
import { classes } from '@jump/util'

import { useRouter } from '../contexts'

// TODO: better loading ui

export function Button ({ className = '', children, to = null, onClick = null, loading = false, ...props }) {
  const router = useRouter()

  if (to && onClick) {
    throw new Error('Button cannot have both a "to" and "onClick" prop')
  }

  if (to) {
    props.onClick = () => router.go(to)
  }

  return (
    <button
      className={classes('underline text-s', className)}
      {...props}
    >
      {loading ? '...' : children}
    </button>
  )
}

export default Button
