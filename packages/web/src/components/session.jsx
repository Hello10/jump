import {
  useState,
  useEffect,
  createContext,
  useContext
} from 'react'

const SessionContext = createContext({
  loading: true,
  session: null,
  error: null,
  supabaseClient: {}
})

export function SessionProvider (props) {
  const children = props.children
  const supabaseClient = props.supabaseClient
  const initialSession = props.initialSession ?? null

  const [session, setSession] = useState(initialSession)
  const [loading, setLoading] = useState(!initialSession)
  const [error, setError] = useState(null)

  useEffect(() => {
    const mounted = true

    async function getSession () {
      const {
        data: { session },
        error
      } = await supabaseClient.auth.getSession()

      console.log('hi got session', { session, error })

      if (mounted) {
        console.log('hi mounted and setting')
        setLoading(false)
        if (error) {
          setError(error)
          setSession(null)
        } else {
          setError(null)
          setSession(session)
        }
      }
    }

    getSession()
  })

  useEffect(() => {
    const {
      data: { subscription }
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session && ['SIGNED_IN', 'TOKEN_REFRESHED'].includes(event)) {
        setSession(session)
      }

      if (event === 'SIGNED_OUT') {
        setSession(null)
      }
    })

    return () => subscription.unsubscribe()
  })

  const value = {
    loading,
    session,
    error,
    supabaseClient: () => supabaseClient
  }

  console.log('context value....', value)

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function useSessionContext () {
  const context = useContext(SessionContext)
  console.log('hi dat context', context)
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider')
  }
  return context
};

export function useSupabaseClient () {
  const context = useSessionContext()
  return context?.supabaseClient
}

export function useSession () {
  const context = useSessionContext()
  return context?.session ?? null
}

export function useUser () {
  const session = useSession()
  return session?.user ?? null
}

export function useSessionLoading () {
  console.log('hihihiih useSessionLoading')
  const context = useSessionContext()
  console.log('useSessionLoading', context)
  return context?.loading
}

export function useGetSessionToken () {
  const supabase = useSupabaseClient()
  return async function getSessionToken () {
    const session = await supabase.auth.getSession()
    return session?.data?.session?.access_token ?? null
  }
}

export function useSignout ({ navigate }) {
  const user = useUser()
  const supabase = useSupabaseClient()

  useEffect(() => {
    async function signout () {
      if (user) {
        await supabase.auth.signOut()
      }
      navigate('/')
    }
    signout()
  })
}
