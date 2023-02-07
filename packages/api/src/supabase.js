import getRequestAuthToken from './getRequestAuthToken'

export async function getSupabaseUser ({ request, supabaseClient }) {
  const token = getRequestAuthToken({ request })
  if (token) {
    const { data } = await supabaseClient.auth.getUser(token)
    if (data) {
      return data.user
    }
  }
  return null
}

export function supabaseUserContextBuilder ({ supabaseClient }) {
  return async (context) => {
    const { request } = context
    const supabaseUser = await getSupabaseUser({ request, supabaseClient })
    return {
      ...context,
      supabaseUser
    }
  }
}
