import px from './px'

export function tailwindScreens({
  breakpoints = {
    xxl: 1280,
    xl: 1024,
    lg: 768,
    md: 640,
    sm: 480
  },
} = {}) {
  return {
    xxl: {
      min: px(breakpoints.xxl)
    },
    xxlMin: {
      min: px(breakpoints.xxl)
    },
    xlMax: {
      max: px(breakpoints.xxl - 1)
    },
    xl: {
      max: px(breakpoints.xxl - 1),
      min: px(breakpoints.xl)
    },
    xlMin: {
      min: px(breakpoints.xl)
    },
    lgMax: {
      max: px(breakpoints.xl - 1),
    },
    lg: {
      max: px(breakpoints.xl - 1),
      min: px(breakpoints.lg)
    },
    lgMin: {
      min: px(breakpoints.lg)
    },
    mdMax: {
      max: px(breakpoints.lg - 1)
    },
    md: {
      max: px(breakpoints.lg - 1),
      min: px(breakpoints.md)
    },
    mdMin: {
      min: px(breakpoints.md)
    },
    smMax: {
      max: px(breakpoints.md - 1)
    },
    sm: {
      max: px(breakpoints.md - 1),
      min: px(breakpoints.sm)
    },
    smMin: {
      min: px(breakpoints.sm)
    },
    xs: {
      max: px(breakpoints.sm - 1)
    }
  }
}

export const tailwind = {
  screens: tailwindScreens
}