import Assert from 'assert'

import Route from './Route'

describe('Route', ()=> {
  describe('constructor', ()=> {
    it('should require all route params', ()=> {
      Assert.throws(()=> {
        const route = new Route({
          name: 'wow',
          path: '/'
        });
        Assert(!route);
      });
    });

    it('should error on specfic method name route params', ()=> {
      Assert.throws(()=> {
        const route = new Route({
          name: 'wow',
          path: '/',
          page: ()=> {},
          match: 'derp'
        });
        Assert(!route);
      });
    });

    it('should fail when missing required param', ()=> {
      Assert.throws(()=> {
        const route = new Route({
          name: 'wow'
        });
        Assert(!route);
      });
    })
  });

  describe('.is', ()=> {
    it('should test match', ()=> {
      const route = new Route({
        name: 'Derp',
        path: '/derp/:derp',
        page: ()=> {}
      });
      Assert(route.is('/derp/wow'));
      Assert(route.is('Derp'));
      Assert(!route.is('Woof'));
      Assert(!route.is('/dooof'));
    });
  });

  describe('.match', ()=> {
    const route = new Route({
      name: 'Derp',
      path: '/derp/:derp',
      page: ()=> {}
    });

    const match = route.match({ url: '/donk/wow' })
    Assert(!match)
  })

  describe('.buildUrl', ()=> {
    const route = new Route({
      name: 'Derp',
      path: '/derp/:derp',
      page: ()=> {}
    });

    const url = route.buildUrl({ derp: 'wow', wut: 'wow2' })
    Assert.equal(url, '/derp/wow?wut=wow2')

    const route2 = new Route({
      name: 'What',
      path: '/what',
      page: ()=> {}
    })
    const url2 = route2.buildUrl()
    Assert.equal(url2, '/what')
  })
});