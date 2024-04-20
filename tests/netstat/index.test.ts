import { expect } from 'chai';
import { IPV4_REGEX } from '@/ip';
import { activeConnections, allocatedPorts } from 'node-netkit/netstat';

describe('Active Connections', () => {
  it('should get active connections', async () => {
    const connections = await activeConnections();
    expect(connections).to.be.an('array');
    expect(connections.length).to.have.greaterThan(0);

    expect(Object.keys(connections[0])).to.have.lengthOf(7);
    expect(connections[0].address).to.match(IPV4_REGEX);
  });

  it('should get allocated ports', async () => {
    for (const p of await allocatedPorts()) {
      expect(p).to.be.greaterThan(0);
      expect(p).to.be.lessThan(65535);
    }
  });
});
