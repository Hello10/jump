export default function subdomainApps (map) {
  const main = map.find((item)=> item.main);
  if (!main) {
    throw new Error('Must set main flag to true on at least one subdomain app');
  }

  return function getApp () {
    const parts = window.location.hostname.split('.');

    let last_index = -2;
    const last = parts[parts.length - 1];
    const is_localhost = last === 'localhost';
    if (is_localhost) {
      last_index = -1;
    }

    const subdomain = parts.slice(0, last_index).join('.');

    if (!subdomain) {
      return main.app;
    }

    const app = map.find(({subdomains})=> subdomains.includes(subdomain));
    if (app) {
      return app.app;
    } else {
      return main.app;
    }
  };
}
