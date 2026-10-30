// Verify ordinary simulator launches without attaching the Hermes debugger.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const appId = 'com.jacksequeira.app';
const reportDir = path.join(os.homedir(), 'Library/Logs/DiagnosticReports');
const reports = () =>
  fs
    .readdirSync(reportDir)
    .filter(
      name => name.startsWith('JackSequeiraMobile-') && name.endsWith('.ips'),
    );
const before = new Set(reports());
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const run = (...args) =>
  execFileSync('xcrun', ['simctl', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
(async () => {
  let pid;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      run('terminate', 'booted', appId);
    } catch {}
    const launch = run('launch', 'booted', appId);
    pid = Number(launch.split(':').at(-1).trim());
    await sleep(3000);
    process.kill(pid, 0);
    console.log(`Launch ${attempt}: process ${pid} remains alive`);
  }
  for (let elapsed = 0; elapsed < 30; elapsed += 5) {
    await sleep(5000);
    process.kill(pid, 0);
  }
  const added = reports().filter(name => !before.has(name));
  if (added.length) throw new Error('New crash reports: ' + added.join(', '));
  console.log(
    'PASS: three launches and 30 seconds of normal operation; no new iOS crash reports.',
  );
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
