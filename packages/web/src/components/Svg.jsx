import React from 'react'

export function Svg ({ width, height, viewBox, children, ...props }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  )
}

export default Svg