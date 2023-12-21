import { expect } from 'chai';
import { route } from '@/ip';

describe('List', () => {
  it('should get the default route', async () => {
    const routes = await route.list();
    expect(routes).to.be.an('array');

    const defaultRoute = routes.find((r) => r.destination === 'default');

    expect(defaultRoute).to.be.an('object');
    expect(defaultRoute).to.have.property('via');

    console.log(defaultRoute);
  });
});
