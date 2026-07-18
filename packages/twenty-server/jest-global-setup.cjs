/* TEMP diagnostic (revert) — main-process instrumentation to identify what
 * silently aborts the in-band server-test run (no failed test, no jest
 * summary). Behavior-preserving: it logs then defers to the original exit. */
module.exports = async function diagGlobalSetup() {
  const write = (msg) => {
    try {
      process.stderr.write(msg);
    } catch (_e) {
      /* noop */
    }
  };

  write('\n[DIAG-GS] installed pid=' + process.pid + '\n');

  const originalExit = process.exit.bind(process);

  process.exit = function patchedExit(code) {
    write(
      '\n[DIAG-GS-EXIT-CALL] process.exit(' +
        String(code) +
        ') pid=' +
        process.pid +
        '\n' +
        new Error('process.exit called from').stack +
        '\n',
    );

    return originalExit(code);
  };

  process.on('exit', function (code) {
    write('\n[DIAG-GS-ON-EXIT] code=' + code + ' pid=' + process.pid + '\n');
  });

  process.on('unhandledRejection', function (reason) {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    write('\n[DIAG-GS-REJECT] pid=' + process.pid + '\n' + (error.stack || String(reason)) + '\n');
    originalExit(1);
  });

  process.on('uncaughtException', function (error) {
    write(
      '\n[DIAG-GS-UNCAUGHT] pid=' +
        process.pid +
        '\n' +
        ((error && error.stack) || String(error)) +
        '\n',
    );
    originalExit(1);
  });

  const ticker = setInterval(function () {
    const usage = process.memoryUsage();

    write(
      '[DIAG-GS-MEM] rss=' +
        Math.round(usage.rss / 1048576) +
        'MB heapUsed=' +
        Math.round(usage.heapUsed / 1048576) +
        'MB pid=' +
        process.pid +
        '\n',
    );
  }, 4000);

  if (typeof ticker.unref === 'function') {
    ticker.unref();
  }
};
