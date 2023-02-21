import { useCallback, useRef, useEffect, useState } from 'react'

export function useFocus ({
  ref: initialRef = null,
  initial: initialValue = false,
  onChange = ()=> {}
} = {}) {
  const nodeRef = useRef(initialRef?.current)
  const [focused, setFocused] = useState(initialValue)

  const focus = useCallback(() => setFocused(true))
  const blur = useCallback(() => setFocused(false))

  const ref = useRefListeners({
    ref: nodeRef,
    listeners: {
      focus,
      blur
    }
  })

  useEffect(() => {
    onChange && onChange(focused)
  }, [focused])

  return { ref, focused, setFocused }
}

export function useActive ({
  ref: initialRef = null,
  initial: initialValue = false,
  onChange = ()=> {}
}) {
  const nodeRef = useRef(initialRef?.current)
  const [active, setActive] = useState(initialValue)

  const ref = useRefListeners({
    ref: nodeRef,
    listeners: {
      'mousedown': () => setActive(true),
      'mouseup': () => setActive(false)
    }
  })

  useEffect(() => {
    onChange && onChange(active)
  }, [active])

  return { ref, active, setActive }
}

export function useHover ({
  ref: initialRef = null,
  initial: initialValue = false,
  onChange = ()=> {}
}) {
  const nodeRef = useRef(initialRef?.current)
  const [hovered, setHovered] = useState(initialValue)

  const ref = useRefListeners({
    ref: nodeRef,
    listeners: {
      'mouseover': () => setHovered(true),
      'mouseout': () => setHovered(false)
    }
  })

  useEffect(() => {
    onChange && onChange(hovered)
  }, [hovered])

  return { ref, hovered, setHovered }
}

export function useRefListeners({ ref, listeners }) {
  const entries = Object.entries(listeners)

  return useCallback((node) => {

    console.log('hi dat node', node, entries)
    if (ref.current) {
      entries.forEach(([event, handler]) => {
        node.removeEventListener(event, handler)
      })
    }

    ref.current = node;

    if (ref.current) {
      entries.forEach(([event, handler]) => {
        node.addEventListener(event, handler)
      })
    }
  }, [entries])
}

export function useMouseStyles({
  ref: initialRef = null,
  style: styleIn = {}
}) {
  const {
    hover: hoverStyle = {},
    focus: focusStyle = {},
    active: activeStyle = {},
    ...style
  } = styleIn

  const ref = useRef(initialRef?.current)
  const { hovered } = useHover({ ref })
  const { focused } = useFocus({ ref })
  const { active } = useActive({ ref })

  console.log({ hovered, focused, active })

  return {
    ref,
    style: {
      ...style,
      ...hovered ? hoverStyle : {},
      ...focused ? focusStyle : {},
      ...active ? activeStyle : {}
    }
  }
}