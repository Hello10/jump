// https://developer.mozilla.org/en-US/docs/Web/API/AbortController
// let cache = new Map();

// function useFakeFetch(URL) {
//   let location = useLocation();
//   let cacheKey = location.key + URL;
//   let cached = cache.get(cacheKey);

//   let [data, setData] = useState(() => {
//     // initialize from the cache
//     return cached || null;
//   });

//   let [state, setState] = useState(() => {
//     // avoid the fetch if cached
//     return cached ? "done" : "loading";
//   });

//   useEffect(() => {
//     if (state === "loading") {
//       let controller = new AbortController();
//       fetch(URL, { signal: controller.signal })
//         .then((res) => res.json())
//         .then((data) => {
//           if (controller.signal.aborted) return;
//           // set the cache
//           cache.set(cacheKey, data);
//           setData(data);
//         });
//       return () => controller.abort();
//     }
//   }, [state, cacheKey]);

//   useEffect(() => {
//     setState("loading");
//   }, [URL]);

//   return data;
// }

// add to stack if not already there { push: true } to force push
// router.go({ name | route,  params = {}, push = false })

// pop from stack ({ top: true } to go to top of stack)
// router.back({ top = false })

// current route
// router.route()

// set params for current route
// router.route.setParams(params)

// useRouter
// useParams

// {
//   pathname: "/bbq/pig-pickins",
//   search: "?campaign=instagram",
//   hash: "#menu",
//   state: null,
//   key: "aefz24ie"
// }

// PUSH, POP, REPLACE

// generate id for each location matchf

// base params for route
// merging params with base
// passing additional data / state on navigation?
// handling data for header / title etc.?
// layouts?
// child routes?
// Tab vs. screen..
// navigating to nested route? `name: Foo/Bar`?
// router groups? signedin/signedout
// ranking routes: When matching URLs to routes, React Router will rank the routes according to the number of segments, static segments, dynamic segments, splats, etc. and pick the most specific match.
// relative paths "foo", ".", ".."
// throwing redirects?
// skeleton ui?
// scroll restoration?

// navigation listeners for animation (focus, blur, stateChanged, beforeRemove)
// React.useEffect(() => {
//   const unsubscribe = navigation.addListener('focus', () => {
//     // Screen was focused
//     // Do something
//   });

// NavLink: active/pending

//   return unsubscribe;
// }, [navigation]);
//
// useFocusEffect, useBlueEffect, useIsFocused


// In your app, you will probably use these patterns depending on the behavior you want:
//
// Tab navigator nested inside the initial screen of stack navigator - New screens cover the tab bar when you push them.
// Drawer navigator nested inside the initial screen of stack navigator with the initial screen's stack header hidden - The drawer can only be opened from the first screen of the stack.
// Stack navigators nested inside each screen of drawer navigator - The drawer appears over the header from the stack.
// Stack navigators nested inside each screen of tab navigator - The tab bar is always visible. Usually pressing the tab again also pops the stack to top.
