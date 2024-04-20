import { execShell } from '@/utils/exec-shell';
import { removeDuplicate } from '@/utils/array';

// ------------------------

export interface ActiveConnection {
  protocol: string;
  program?: string;
  recvQ: number;
  sendQ: number;
  address: string;
  port: number;
  state?: string;
}

export async function activeConnections(): Promise<ActiveConnection[]> {
  const { error, data } = await execShell(['netstat', '-tuapn']);
  if (error) {
    throw error;
  }

  const lines = data.output.split('\n');
  const ports: ActiveConnection[] = [];
  for (const line of lines) {
    const match =
      /^(\w+)\s+(\d+)\s+(\d+)\s+((?:::)?(?:(?:(?:\d{1,3}\.){3}(?:\d{1,3}){1})?[0-9a-f]{0,4}:{0,2}){1,8}(?:::)?)\s+((?:::)?(?:(?:(?:\d{1,3}\.){3}(?:\d{1,3}){1})?[0-9a-f]{0,4}:{0,2}){1,8}(?:::)?\*?)\s+(\w+)?\s+(.*)$/.exec(
        line
      );
    if (match) {
      const port = match[4].split(':').at(-1);
      const address = match[4].replace(`:${port}`, '');
      const connection: ActiveConnection = {
        protocol: match[1],
        recvQ: Number(match[2]),
        sendQ: Number(match[3]),
        address: address,
        port: Number(port),
        state: match[6] ? match[6].trim() : undefined,
        program: match[7].trim(),
      };
      ports.push(connection);
    }
  }

  return ports;
}

export async function allocatedPorts(): Promise<number[]> {
  const cns = await activeConnections();
  return removeDuplicate(cns.map((cn) => cn.port));
}
