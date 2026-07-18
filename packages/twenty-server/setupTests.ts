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

// TEMP DIAGNOSTIC (to be reverted) — the in-band jest run (maxWorkers=1) aborts
// silently when an async error escapes a finished suite. Register a per-file
// unhandledRejection + uncaughtException logger that names the current test and
// prints the stack, so the CI server-test log identifies the real source.
type LeakDiagProcess = NodeJS.Process & {
  __leakRejectionHandler?: (reason: unknown) => void;
  __leakExceptionHandler?: (error: unknown) => void;
};

const leakDiagProcess = process as LeakDiagProcess;

const logLeak = (kind: string, value: unknown): void => {
  const error = value instanceof Error ? value : new Error(String(value));

  let testName = '<between-tests-or-unknown>';
  let testPath = '<unknown>';

  try {
    const state = (
      expect as unknown as {
        getState?: () => { currentTestName?: string; testPath?: string };
      }
    ).getState?.();

    testName = state?.currentTestName ?? testName;
    testPath = state?.testPath ?? testPath;
  } catch {
    // best-effort
  }

  process.stderr.write(
    `\n[LEAK] ${kind} | test="${testName}" | path=${testPath}\n` +
      `${error.stack ?? String(error)}\n[/LEAK]\n`,
  );
};

if (leakDiagProcess.__leakRejectionHandler) {
  process.removeListener(
    'unhandledRejection',
    leakDiagProcess.__leakRejectionHandler,
  );
}
leakDiagProcess.__leakRejectionHandler = (reason) =>
  logLeak('unhandledRejection', reason);
process.on('unhandledRejection', leakDiagProcess.__leakRejectionHandler);

if (leakDiagProcess.__leakExceptionHandler) {
  process.removeListener(
    'uncaughtException',
    leakDiagProcess.__leakExceptionHandler,
  );
}
leakDiagProcess.__leakExceptionHandler = (error) =>
  logLeak('uncaughtException', error);
process.on('uncaughtException', leakDiagProcess.__leakExceptionHandler);
