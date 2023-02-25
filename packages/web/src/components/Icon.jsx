import React from 'react'
import { classes } from '@jump/util'

import Button from './Button'
import Svg from './Svg'

const defaultWidth = 32
const defaultHeight = 32

export function Icon({
  children,
  width = null,
  height = null,
  size = null,
  viewBox = null,
  className = '',
  ...props
}) {
  if (size) {
    width = size
    height = size
  }

  if (!width) {
    width = defaultWidth
  }
  if (!height) {
    height = defaultHeight
  }

  if (!viewBox) {
    viewBox = `0 0 ${defaultWidth} ${defaultHeight}`
  }

  const isButton = props.to || props.onClick
  const Container = isButton ? Button : 'div'

  return (
    <Container
      className={classes(
        'flex items-center justify-center',
        isButton && 'cursor-pointer',
        className
      )}
      {...props}
    >
      <Svg
        width={width}
        height={height}
        viewBox={viewBox}
      >
        {children}
      </Svg>
    </Container>
  )
}

export default Icon