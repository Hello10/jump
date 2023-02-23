import {
  useState,
  useEffect,
  useMemo,
  createContext,
  useContext
} from 'react'
import { Router as JumpRouter } from '@jump/router'

const RouterContext = createContext({
  ready: false,
  url: null,
  error: null,
  match: null,
  route: null,
  params: {},
  page: null,
  go: ()=> {},
  back: ()=> {}
})

export function RouterProvider(props) {
  const {
    children,
    routes,
    redirects,
    onGo = ()=> {},
    ...baseInput // TODO: handle baseInput
  } = props
  const [ready, setReady] = useState(false)
  const [match, setMatch] = useState(null)
  const [error, setError] = useState(null)

  const router = useMemo(()=> {
    return new JumpRouter({
      routes,
      redirects,
      onGo: (match)=> {
        setMatch(match)
        setError(null)
        onGo(match)
      }
    })
}, [routes, redirects, onGo])

  // Start the router on mount
  useEffect(()=> {
    const match = router.start()
    setMatch(match)
    setReady(true)
  }, [])

  const url = match?.url
  const route = match?.route
  const params = match?.params
  const page = route?.page

  function go(...args) {
    try {
      const match = router.go(...args)
      setMatch(match)
      setError(null)
    } catch (error) {
      setError(error)
      setMatch(null)
    }
  }

  function back() {
    const match = router.back()
    setMatch(match)
    setError(null)
  }

  function forward() {
    const match = router.forward()
    setMatch(match)
    setError(null)
  }

  const value = {
    ready,
    url,
    error,
    match,
    route,
    params,
    page,
    go,
    back,
    forward
  }

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  const context = useContext(RouterContext)
  if (context === undefined) {
    throw new Error('useRouter must be used within a RouterProvider')
  }
  return context
}

export function useRouterGo() {
  const router = useRouter()
  return router.go
}

export function useRouterParams() {
  const router = useRouter()
  return router.params
}

export function useRouterError() {
  const router = useRouter()
  return router.error
}

export function useRouterPage() {
  const router = useRouter()
  return router.page
}

// export function useLocationSearch () {
//   const search = window.location.search
//   const params = new URLSearchParams(search)
//   return params
// }
