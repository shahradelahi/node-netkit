import { trySafe } from 'p-safe';
import { ShellError } from '@/errors';

export async function execShell(cmd: string[]) {
  return trySafe<ShellResult, ShellError>(async () => {
    const { execa } = await import('execa');

    const res = await execa(cmd.join(' '), {
      shell: true,
    });

    const success = res.exitCode === 0;
    const [stdout, stderr] = [res.stdout, res.stderr].map((s) => s.trim());

    if (success || (stdout && stdout !== '')) {
      return {
        data: {
          output: stdout,
          exitCode: res.exitCode,
        },
      };
    }

    return { error: new ShellError(stderr, res.exitCode) };
  });
}

export interface ShellResult {
  output: string;
  exitCode: number;
}
