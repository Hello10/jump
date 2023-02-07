export function nodeEnv () {
  // FIND OUT WHY THIS ISN'T WORKING
  return process.env.NODE_ENV ?? 'development'
}

export function isNodeEnv (envs) {
  const env = nodeEnv().toLowerCase()
  return envs.map((e) => e.toLowerCase()).includes(env)
}

export function isProductionEnv () {
  return isNodeEnv(['prd', 'prod', 'production'])
}

export function isStagingEnv () {
  return isNodeEnv(['stg', 'stag', 'staging'])
}

export function isDevelopmentEnv () {
  return isNodeEnv(['dev', 'development'])
}

export function isTestEnv () {
  return isNodeEnv(['tst', 'test', 'testing'])
}
