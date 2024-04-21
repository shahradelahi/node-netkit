import { link } from 'node-netkit/ip';
import { expect } from 'chai';

describe('Link', () => {
  it('should list links and locate loopback', async () => {
    const links = await link.list();

    expect(links).to.be.an('array');
    expect(links.length).to.be.greaterThan(0);

    expect(links[0]).to.have.property('name');
    expect(links[0]).to.have.property('flags');
    expect(links[0]).to.have.property('qdisc');
    expect(links[0]).to.have.property('state');
    expect(links[0]).to.have.property('mode');
    expect(links[0]).to.have.property('group');
    expect(links[0]).to.have.property('qlen');
    expect(links[0]).to.have.property('mtu');
    expect(links[0]).to.have.property('address');
    expect(links[0]).to.have.property('broadcast');

    const loopback = links.find((l) => l.name === 'lo');
    expect(loopback).to.be.an('object');
    expect(loopback).to.have.property('address', '00:00:00:00:00:00');
    expect(loopback).to.have.property('broadcast', '00:00:00:00:00:00');
  });
});
