export function nodeEnv () {
  return process.env.NODE_ENV
}

export function isDev () {
  return nodeEnv() === 'development'
}

export function isProd () {
  return nodeEnv() === 'production'
}
