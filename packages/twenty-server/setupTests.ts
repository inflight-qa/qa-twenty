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

// twenty-server's jest CI run is in-band (`nx` runs the `test` target with the
// `ci` configuration, which sets `maxWorkers: 1`), so every *.spec.ts shares a
// single Node process. Jest attributes a rejection to the test running at the
// time, but a promise leaked by an already-finished suite rejects with no
// owner. With no `unhandledRejection` listener registered, Node's default
// action then tears the whole process down (exit 1) — surfacing as a silent,
// flaky CI failure with no failed test and no jest summary, blamed on whichever
// suite happened to be running rather than on the one that leaked the promise.
//
// Register a single process-wide listener so a stray rejection can no longer
// abort the run, and print its stack so the leaking suite can be found and
// fixed at the source. The guard lives on `process` (shared across the in-band
// test files) so the listener is installed exactly once.
type ProcessWithRejectionGuard = NodeJS.Process & {
  __twentyUnhandledRejectionListenerInstalled?: boolean;
};

const processWithRejectionGuard = process as ProcessWithRejectionGuard;

if (!processWithRejectionGuard.__twentyUnhandledRejectionListenerInstalled) {
  processWithRejectionGuard.__twentyUnhandledRejectionListenerInstalled = true;

  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    process.stderr.write(
      '\n[twenty-server tests] Ignored an unhandled promise rejection so it ' +
        'cannot abort the in-band run. Fix the test that leaks this promise ' +
        `(await it, or attach a .catch):\n${error.stack ?? String(error)}\n`,
    );
  });
}
