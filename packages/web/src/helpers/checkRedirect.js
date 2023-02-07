export function checkRedirect ({ user, path, routes, redirects }) {
  const route = routes.find((r) => r.path === path)
  if (route) {
    const valid = route.test({ user })
    if (!valid) {
      return user ? redirects.signedIn : redirects.signedOut
    }
  }
  return null
}
