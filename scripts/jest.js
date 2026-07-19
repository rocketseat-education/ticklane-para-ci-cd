#!/usr/bin/env node
/**
 * Jest wrapper for Node 25.2.0: Jest's environment enumerates globals and
 * trips experimental Web Storage unless this flag (or a newer Node) is set.
 * Keeps IDE / npx jest invocations consistent with `npm test`.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const nodeOptions = [process.env.NODE_OPTIONS, '--no-experimental-webstorage']
  .filter(Boolean)
  .join(' ');

const result = spawnSync(
  process.execPath,
  [require.resolve('jest/bin/jest'), '--watchman=false', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: nodeOptions,
    },
    cwd: path.resolve(__dirname, '..'),
  },
);

process.exit(result.status ?? 1);
