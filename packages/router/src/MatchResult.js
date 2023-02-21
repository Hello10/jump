export default class MatchResult {
  constructor ({
    input,
    route = null,
    url = null,
    params = {},
    redirect = false
  }) {
    this.input = input;
    this.route = route;
    this.params = params;
    this.redirect = redirect;
    this.original = null;
    this.url = url || route.buildUrl(params);
  }

  isRedirect ({original}) {
    this.redirect = true;
    this.original = original;
  }
}
