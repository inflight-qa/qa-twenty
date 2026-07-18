import { i18n } from '@lingui/core';
import { compileMessage } from '@lingui/message-utils/compileMessage';

// Lingui 5.9+ throws when a translation function runs without an active
// locale. Production activates the global singleton in I18nService; unit
// tests bypass Nest bootstrap, so mirror that here. The messages compiler
// makes t`...` fall back to the English source text.
i18n.setMessagesCompiler(compileMessage);
i18n.load('en', {});
i18n.activate('en');

declare global {
  namespace jest {
    interface Matchers<R> {
      toThrowError(error?: string | RegExp | Error): R;
      toBeCalledTimes(expected: number): R;
    }
  }
}

// TEMP DIAGNOSTIC (to be reverted) — test-process instrumentation. Wrap
// process.exit to capture the caller stack, log exit codes, and ticker memory,
// tagged with pid so we can tell in-band (same pid as globalSetup) from worker.
type DiagProcess = NodeJS.Process & {
  __diagStInstalled?: boolean;
  __diagStOrigExit?: (code?: number) => never;
};

const diagProcess = process as DiagProcess;

const diagWrite = (message: string): void => {
  try {
    process.stderr.write(message);
  } catch {
    // best-effort
  }
};

if (!diagProcess.__diagStInstalled) {
  diagProcess.__diagStInstalled = true;

  diagWrite(`\n[DIAG-ST] installed pid=${process.pid}\n`);

  diagProcess.__diagStOrigExit = process.exit.bind(process) as (
    code?: number,
  ) => never;

  process.exit = ((code?: number): never => {
    diagWrite(
      `\n[DIAG-ST-EXIT-CALL] process.exit(${String(code)}) pid=${process.pid}\n` +
        `${new Error('process.exit called from').stack}\n`,
    );

    return (diagProcess.__diagStOrigExit as (code?: number) => never)(code);
  }) as typeof process.exit;

  process.on('exit', (code) =>
    diagWrite(`\n[DIAG-ST-ON-EXIT] code=${code} pid=${process.pid}\n`),
  );

  const ticker = setInterval(() => {
    const usage = process.memoryUsage();

    diagWrite(
      `[DIAG-ST-MEM] rss=${Math.round(usage.rss / 1048576)}MB ` +
        `heapUsed=${Math.round(usage.heapUsed / 1048576)}MB pid=${process.pid}\n`,
    );
  }, 4000);

  if (typeof ticker.unref === 'function') {
    ticker.unref();
  }
}
