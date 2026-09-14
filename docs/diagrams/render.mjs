// Renders every docs/diagrams/src/*.mmd into docs/diagrams/*.svg and *.png.
//
// Usage (from the repo root):
//   node docs/diagrams/render.mjs
//
// Requires a local Chrome/Chromium. Set MERMAID_CHROME to its path when it is
// not at the default Windows location. Puppeteer's own download is skipped.
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, 'src');
const configPath = join(here, 'mermaid.config.json');
const puppeteerPath = join(tmpdir(), 'jarvis-mermaid-puppeteer.json');

const chrome =
  process.env.MERMAID_CHROME ??
  [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].find((candidate) => existsSync(candidate));

if (!chrome) {
  console.error('No Chrome/Chromium found. Set MERMAID_CHROME=<path>.');
  process.exit(1);
}

writeFileSync(
  puppeteerPath,
  JSON.stringify({ executablePath: chrome, args: ['--no-sandbox'] }),
);

const files = readdirSync(srcDir).filter((file) => file.endsWith('.mmd'));

for (const file of files) {
  const input = join(srcDir, file);
  const base = resolve(here, file.replace(/\.mmd$/, ''));

  for (const [ext, extra] of [
    ['svg', ''],
    ['png', '-w 1600 -s 2'],
  ]) {
    const output = `${base}.${ext}`;
    console.log(`→ ${output}`);
    execSync(
      `npx -y @mermaid-js/mermaid-cli@11 -p "${puppeteerPath}" -c "${configPath}" -b "#faf5ec" -i "${input}" -o "${output}" ${extra}`,
      { stdio: 'inherit', env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: '1' } },
    );
  }
}
