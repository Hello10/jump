import React from 'react'
import { classes } from '@jump/util'

export function Button ({ className = '', children, loading, ...props }) {
  return (
    <button
      {...props}
      className={classes('underline text-s', className)}
    >
      {loading ? '...' : children}
    </button>
  )
}
