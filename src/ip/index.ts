import { del as linkDel } from './link';

// ------------------------

export * as route from './route';
export * as link from './link';

// ------------------------

/**
 * Drop Device
 *
 * Example:
 * ```javascript
 * await dropDevice('tun0');
 * ```
 *
 * @param name "DEVICE_NAME" or "dev NAME" or "group NAME"
 */
export async function dropDevice(name: string) {
  const { error } = await linkDel({
    name,
  });

  if (error) {
    throw error;
  }
}

// ------------------------

export type IPFamily = 'IPv4' | 'IPv6';

export const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
export const IPV6_REGEX = /^(::)?(((\d{1,3}\.){3}(\d{1,3}){1})?([0-9a-f]){0,4}:{0,2}){1,8}(::)?$/i;

export const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

export function isValidIP(ip: string) {
  return isValidIPv4(ip) || isValidIPv6(ip);
}

export function isValidIPv4(ip: string) {
  return IPV4_REGEX.test(ip);
}

export function isValidIPv6(ip: string) {
  return IPV6_REGEX.test(ip);
}

export function isValidCIDR(cidr: string) {
  const parts = cidr.split('/');
  return isValidIP(parts[0]) && parts[1] && !isNaN(+parts[1]);
}

export function parseCIDR(cidr: string) {
  if (!isValidCIDR(cidr)) {
    throw new Error(`Invalid CIDR: ${cidr}`);
  }
  const parts = cidr.split('/');
  return {
    ip: parts[0],
    mask: +parts[1],
  };
}

export function getIPFamily(ip: string): IPFamily {
  if (ip.includes('/')) {
    const { ip: ipPart } = parseCIDR(ip);
    ip = ipPart;
  }

  if (isValidIPv4(ip)) {
    return 'IPv4';
  }

  if (isValidIPv6(ip)) {
    return 'IPv6';
  }

  throw new Error(`Not a valid IP address: ${ip}`);
}

export function getIPVersion(ip: string) {
  return getIPFamily(ip) === 'IPv4' ? 4 : 6;
}

export function isLoopback(addr: string) {
  // Yanked from https://github.com/indutny/node-ip/blob/3b0994a74eca51df01f08c40d6a65ba0e1845d04/lib/ip.js#L346-L352
  return (
    /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/.test(addr) ||
    /^0177\./.test(addr) ||
    /^0x7f\./i.test(addr) ||
    /^fe80::1$/i.test(addr) ||
    /^::1(\/[0-9]{1,3})?$/.test(addr) ||
    /^::$/.test(addr)
  );
}

/**
 * Private IP Address Identifier in Regular Expression
 *
 * 127.0.0.0   – 127.255.255.255      127.0.0.0 /8
 * 10.0.0.0    –  10.255.255.255       10.0.0.0 /8
 * 172.16.0.0  – 172. 31.255.255    172.16.0.0 /12
 * 192.168.0.0 – 192.168.255.255   192.168.0.0 /16
 */
export function isPrivateIP(addr: string) {
  if (isLoopback(addr)) {
    return true;
  }

  if (addr.includes('/')) {
    addr = parseCIDR(addr).ip;
  }

  const version = getIPVersion(addr);
  if (version === 4) {
    return /^(127\.)|(10\.)|(172\.1[6-9]\.)|(172\.2[0-9]\.)|(172\.3[0-1]\.)|(192\.168\.)/.test(
      addr
    );
  }

  // Yanked from https://github.com/indutny/node-ip/blob/3b0994a74eca51df01f08c40d6a65ba0e1845d04/lib/ip.js#L325-L333
  return (
    /^(::f{4}:)?10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
    /^(::f{4}:)?192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
    /^(::f{4}:)?172\.(1[6-9]|2\d|30|31)\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
    /^(::f{4}:)?169\.254\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) ||
    /^f[cd][0-9a-f]{2}:/i.test(addr) ||
    /^fe80:/i.test(addr) ||
    /^::1$/.test(addr) ||
    /^::$/.test(addr)
  );
}

export function isPublicIP(addr: string) {
  return !isPrivateIP(addr);
}

// Helper function to convert IP to number
export function toLong(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet, index) => acc + parseInt(octet, 10) * 256 ** (3 - index), 0);
}

// Helper function to convert number to IP
export function fromLong(num: number): string {
  const octets = [];
  for (let i = 3; i >= 0; i--) {
    octets.push(Math.floor(num / 256 ** i));
    num %= 256 ** i;
  }
  return octets.join('.');
}

/**
 * const generator = generateIPs('127.0.0.1/24');
 * console.log(Array.from(generator)); // ['127.0.0.1', '127.0.0.2', ...]
 *
 * @param cidr
 */
export function* generateIP(cidr: string): Generator<string, void> {
  const { ip: baseIP, mask } = parseCIDR(cidr);
  if (mask === 32) {
    yield baseIP;
    return;
  }

  const hostBits = 32 - mask;
  const maxHosts = 2 ** hostBits;

  // Convert the base IP to a number
  const currentIP = toLong(baseIP);

  // Generate IPs
  for (let i = 1; i < maxHosts - 1; i++) {
    yield fromLong(currentIP + i);
  }
}

export function isValidMacAddress(mac: string) {
  return MAC_REGEX.test(mac);
}
