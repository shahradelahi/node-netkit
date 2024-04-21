import { execShell } from '@/utils/exec-shell';
import { isValidMacAddress } from '@/ip/index';

const LINK_TYPES = <const>[
  'amt',
  'bareudp',
  'bond',
  'bond_slave',
  'bridge',
  'bridge_slave',
  'dsa',
  'dummy',
  'erspan',
  'geneve',
  'gre',
  'gretap',
  'gtp',
  'ifb',
  'ip6erspan',
  'ip6gre',
  'ip6gretap',
  'ip6tnl',
  'ipip',
  'ipoib',
];

export type LinkType = (typeof LINK_TYPES)[number];

export type AddParams = Record<string, string> & {
  type?: LinkType;
  name?: string;
  txqueuelen?: number;
  address?: string;
  broadcast?: string;
  mtu?: number;
  numtxqueues?: number;
  numrxqueues?: number;
  netns?: string;
};

export async function add(params: AddParams) {
  const args = [
    'ip',
    'link',
    'add',
    ...Object.entries(params).map(([key, value]) => `${key.toLowerCase()} ${value}`),
  ];
  return execShell(args);
}

export type DelParams = Record<string, string> & {
  name?: string;
  type?: LinkType;
};

export async function del(params: DelParams) {
  const args = [
    'ip',
    'link',
    'delete',
    ...Object.entries(params).map(([key, value]) => `${key.toLowerCase()} ${value}`),
  ];
  return execShell(args);
}

export type ListParams = Record<string, string> & {
  name?: string;
  type?: LinkType;
};

export type Link = {
  name: string;
  flags: string[];
  qdisc: string;
  state: string;
  mode: string;
  group: string;
  qlen?: number;
  mtu: number;
  address?: string;
  broadcast?: string;
};

export async function list(params: ListParams = {}): Promise<Link[]> {
  const args = [
    'ip',
    'link',
    'show',
    ...Object.entries(params).map(([key, value]) => `${key.toLowerCase()} ${value}`),
  ];

  const { error, data } = await execShell(args);

  if (error) {
    throw error;
  }

  const lines = data.output.match(/^\d+:(.*|(?:\n\s)+)+/gm)!;
  const links: Link[] = [];

  for (const line of lines) {
    const link = parseLink(line);
    if (link) {
      links.push(link);
    }
  }

  return links;
}

function parseLink(line: string) {
  if (!line) {
    return undefined;
  }

  const parts = line.replace(/\n$/, ' ').split(/\s+/).slice(1);
  if (parts.length < 6) {
    return undefined;
  }

  const link: Link = {
    name: parts[0].slice(0, -1),
    flags: parts[1].slice(1, -1).split(','),
    qdisc: '',
    state: '',
    mode: '',
    group: '',
    qlen: undefined,
    mtu: -1,
    address: undefined,
    broadcast: undefined,
  };

  for (const part of parts.slice(2)) {
    const next = parts[parts.indexOf(part) + 1];
    if (part in link) {
      // @ts-expect-error Type 'string' is not assignable to type 'Link[keyof Link]'.
      link[part] = next.match(/^\d+$/) ? +next : next;
    }

    if (part.startsWith('link/') && isValidMacAddress(next)) {
      link.address = next;
    }

    if (part === 'brd') {
      link.broadcast = next;
    }
  }

  return link;
}
