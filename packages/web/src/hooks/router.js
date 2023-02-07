// import { useNavigate } from 'solid-start'

// // TODO: support named routes?
// export function useNavigate() {
//   const router = useRouter()
//   return (path) => {
//     const current = router.asPath
//     if (current !== path) {
//       router.push(path)
//     }
//   }
// }

export function useLocationSearch () {
  const search = window.location.search
  const params = new URLSearchParams(search)
  return params
}
