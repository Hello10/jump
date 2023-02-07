export function getRequestAuthToken ({ request }) {
  const header = request.headers.get('Authorization')
  if (!header?.length) {
    return null
  }
  const token = header.replace('Bearer ', '')
  return token
}

export default getRequestAuthToken
