import { execaCommand } from 'execa';

interface RoutingTableEntry {
  destination: string; // e.g., "default" or "192.168.1.0/24"
  via: string | null; // e.g., "192.168.1.1" (for default route)
  dev: string; // e.g., "wlp3s0"
  proto: string; // e.g., "dhcp" or "kernel"
  src: string; // e.g., "192.168.1.102"
  metric: number; // e.g., 600
  scope: string | null; // e.g., "link"
}

export async function list() {
  const { stdout } = await execaCommand('ip route list');

  const lines = stdout.split('\n');
  const routes: RoutingTableEntry[] = [];

  for (const line of lines) {
    const route = parseRoute(line);
    if (route) {
      routes.push(route);
    }
  }

  return routes;
}

export async function defaultRoute() {
  const routes = await list();
  return routes.find((r) => r.destination === 'default');
}

function parseRoute(line: string): RoutingTableEntry | undefined {
  const parts = line.trim().split(' ');

  // if there are less than 2 parts, then this is not a valid route
  if (parts.length < 2) {
    return undefined;
  }

  const route: RoutingTableEntry = {
    destination: '',
    via: null,
    dev: '',
    proto: '',
    src: '',
    metric: 0,
    scope: null,
  };

  if (parts[0] === 'default') {
    route.destination = parts[0];
    parts.splice(0, 1);
  }

  // regex: <ip>/<mask>
  if (parts[0].match(/^\d+\.\d+\.\d+\.\d+\/\d+$/)) {
    route.destination = parts[0];
    parts.shift();
  }

  if (parts[0] === 'via') {
    route.via = parts[1];
    parts.splice(0, 2);
  }

  if (parts[0] === 'dev') {
    route.dev = parts[1];
    parts.splice(0, 2);
  }

  if (parts[0] === 'proto') {
    route.proto = parts[1];
    parts.splice(0, 2);
  }

  if (parts[0] === 'scope') {
    route.scope = parts[1];
    parts.splice(0, 2);
  }

  if (parts[0] === 'src') {
    route.src = parts[1];
    parts.splice(0, 2);
  }

  if (parts[0] === 'metric') {
    route.metric = parseInt(parts[1], 10);
    parts.splice(0, 2);
  }

  return route;
}
