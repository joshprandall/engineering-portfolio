const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

if (process.platform !== 'win32') {
  console.log('SKIP Crown & Ash Windows artifact integrity: Windows-only gate.');
  process.exit(0);
}

const repoRoot = path.resolve(__dirname, '..');
const desktopRoot = path.join(repoRoot, 'products', 'crown-and-ash-desktop');
const distRoot = path.resolve(process.argv[2] || path.join(desktopRoot, 'dist'));
const pkg = JSON.parse(fs.readFileSync(path.join(desktopRoot, 'package.json'), 'utf8'));

assert.equal(pkg.build?.win?.executableName, 'Crown-and-Ash', 'Windows executable name must remain shell-safe.');
assert.equal(pkg.build?.win?.target?.[0]?.target, 'nsis', 'Windows release target must remain NSIS.');
assert.deepEqual(pkg.build?.win?.target?.[0]?.arch, ['x64'], 'Current Windows release architecture must remain x64.');
assert.equal(pkg.build?.nsis?.runAfterFinish, false, 'Installer must not auto-run after finishing.');
assert.equal(pkg.build?.asar, true, 'Desktop release must package application source into ASAR.');

const expectedInstaller = path.join(distRoot, `Crown-and-Ash-${pkg.version}-x64.exe`);
const unpackedRoot = path.join(distRoot, 'win-unpacked');
const appExe = path.join(unpackedRoot, 'Crown-and-Ash.exe');
const appAsar = path.join(unpackedRoot, 'resources', 'app.asar');

for (const [label, target, minBytes] of [
  ['NSIS installer', expectedInstaller, 20_000_000],
  ['packaged executable', appExe, 20_000_000],
  ['ASAR application bundle', appAsar, 100_000],
]) {
  assert(fs.existsSync(target), `${label} not found: ${target}`);
  const stat = fs.statSync(target);
  assert(stat.isFile(), `${label} is not a file: ${target}`);
  assert(stat.size >= minBytes, `${label} is unexpectedly small (${stat.size} bytes): ${target}`);
}

assert.equal(fs.existsSync(path.join(unpackedRoot, 'resources', 'app')), false,
  'Packaged source must not be emitted as a loose resources/app directory when ASAR is enabled.');

function sha256(file) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    let bytesRead = 0;
    do {
      bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (bytesRead) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead);
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
}

const files = [
  { role: 'installer', path: expectedInstaller },
  { role: 'executable', path: appExe },
  { role: 'appAsar', path: appAsar },
].map(entry => {
  const stat = fs.statSync(entry.path);
  const digest = sha256(entry.path);
  assert.match(digest, /^[a-f0-9]{64}$/, `Invalid SHA-256 for ${entry.role}`);
  return {
    role: entry.role,
    file: path.relative(distRoot, entry.path).replaceAll('\\', '/'),
    bytes: stat.size,
    sha256: digest,
  };
});

assert.equal(new Set(files.map(file => file.sha256)).size, files.length,
  'Release payload components unexpectedly share the same SHA-256 digest.');

const manifest = {
  schema: 1,
  product: 'Crown & Ash',
  publisher: 'CindrVault / Roughneck Forge',
  version: pkg.version,
  platform: 'win32',
  arch: 'x64',
  packageFormat: 'NSIS',
  asar: true,
  generatedAt: new Date().toISOString(),
  sourceCommit: process.env.GITHUB_SHA || null,
  files,
};

const manifestPath = path.join(distRoot, 'crown-and-ash-artifact-integrity.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

const reparsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert.equal(reparsed.version, pkg.version);
assert.equal(reparsed.files.length, 3);
for (const entry of reparsed.files) {
  assert.match(entry.sha256, /^[a-f0-9]{64}$/);
  assert(entry.bytes > 0);
}

console.log(`PASS Crown & Ash Windows artifact integrity: ${path.basename(expectedInstaller)}, shell-safe executable, ASAR packaging, and SHA-256 manifest verified.`);
console.log(`Integrity manifest: ${manifestPath}`);
