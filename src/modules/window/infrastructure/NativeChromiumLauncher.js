import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SIZE = { width: 1220, height: 880 };
let activeWindow = null;

export class NativeChromiumLauncher {
  #findChromiumBrowsers() {
    if (process.platform === 'win32') {
      const roots = [
        process.env['PROGRAMFILES(X86)'] ?? '',
        process.env['PROGRAMFILES'] ?? '',
        process.env['LOCALAPPDATA'] ?? '',
      ].filter(Boolean);
      const rels = [
        'Microsoft\\Edge\\Application\\msedge.exe',
        'Google\\Chrome\\Application\\chrome.exe',
        'BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      ];
      const found = [];
      for (const r of roots) {
        for (const rel of rels) {
          const full = join(r, rel);
          if (existsSync(full)) found.push(full);
        }
      }
      return found;
    }

    if (process.platform === 'darwin') {
      const apps = ['Google Chrome', 'Microsoft Edge', 'Brave Browser', 'Chromium'];
      return apps
        .map((a) => `/Applications/${a}.app/Contents/MacOS/${a}`)
        .filter((p) => existsSync(p));
    }

    // Linux
    const names = [
      'google-chrome',
      'google-chrome-stable',
      'chromium',
      'chromium-browser',
      'microsoft-edge',
      'microsoft-edge-stable',
      'brave-browser',
    ];
    const found = [];
    for (const name of names) {
      try {
        const p = execFileSync('which', [name], { encoding: 'utf8' }).trim();
        if (p && existsSync(p)) found.push(p);
      } catch {}
    }
    return found;
  }

  openFallbackBrowser(url) {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  }

  openWindow(url, dataDir) {
    if (activeWindow && activeWindow.exitCode === null) return true;

    const profileDir = join(dataDir, 'window-profile');
    try {
      mkdirSync(profileDir, { recursive: true });
    } catch {}

    const browsers = this.#findChromiumBrowsers();
    for (const browser of browsers) {
      try {
        const child = spawn(
          browser,
          [
            `--app=${url}`,
            `--window-size=${SIZE.width},${SIZE.height}`,
            `--user-data-dir=${profileDir}`,
            '--no-first-run',
            '--no-default-browser-check',
          ],
          {
            detached: process.platform !== 'win32',
            stdio: 'ignore',
            windowsHide: true,
          },
        );
        activeWindow = child;
        child.on('error', () => {
          activeWindow = null;
          this.openFallbackBrowser(url);
        });
        child.unref();
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }
}
