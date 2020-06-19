import getSubdomain from './getSubdomain';

export default function subdomainApps (map) {
  const main = map.find((item)=> item.main);
  if (!main) {
    throw new Error('Must set main flag to true on at least one subdomain app');
  }

  return function getApp () {
    const {hostname} = window.location;
    const subdomain = getSubdomain(hostname);

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
