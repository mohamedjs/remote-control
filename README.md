# Remote Control

Zero-lag cross-platform desktop remote trackpad, keyboard, and context deck hub. Drive your computer from your mobile device over local Wi-Fi with sub-millisecond responsiveness, native desktop dashboard integration, and air-tight whitelist security.

🌐 **Landing Page:** [https://mohamedjs.github.io/remote-control/](https://mohamedjs.github.io/remote-control/)

---

## Features

- **⚡ Sub-Millisecond Input Streaming:** Fast WebSocket transport with TCP non-coalescing (`setNoDelay`) and native `@nut-tree-fork/nut-js` mouse and keyboard simulation.
- **🎛️ Universal Context Decks:** Instant macro and media decks for YouTube, Spotify, Netflix, VLC, VS Code, Google Meet, Google Slides, and system volume/power.
- **🎙️ Natural Language Voice Intent:** Spoken commands parsed via Groq (Llama-3) strictly gated to an internal whitelist catalog — arbitrary keys or shell commands can never run.
- **🖥️ Native Desktop Window & Dashboard:** Clean chromeless desktop app window with real-time pairing QR code, dark/light themes, and bilingual EN/AR interface.
- **📦 Multi-OS Packaging:** Automated release workflows shipping Linux `.deb` + portable `.tar.gz`, macOS Apple Silicon & Intel zips, and Windows Inno Setup `.exe`.
- **🏛️ Layered Modular Monolith Architecture:** DDD module boundaries (`domain` → `application` → `infrastructure`), single composition root, typed synchronous EventBus, and automated boundary tests.

---

## Architecture

```text
src/
├── main.js                  # CLI & lifecycle entrypoint (run, window/dashboard, doctor, --version)
├── composition-root.js      # The ONLY place modules & adapters are wired together
├── kernel/                  # Cross-cutting primitives (depends on NO module)
│   ├── paths/paths.js       # Per-OS config, data, and log directories (XDG / AppData / Library)
│   ├── events/EventBus.js   # Typed synchronous in-process pub/sub (emits facts, never commands)
│   ├── errors/AppError.js   # Structured application error
│   ├── logging/logger.js    # Structured contextual logger
│   ├── process/shutdown.js  # Graceful LIFO reverse-order shutdown coordinator
│   ├── result/Result.js     # Ok / Err functional result type
│   └── i18n/                # en.json, ar.json, i18n.js
└── modules/
    ├── input/               # Mouse & keyboard simulation (InputPort, NutInputAdapter)
    ├── decks/               # Context deck engine, manifest validator, and Groq voice intent
    ├── server/              # Express HTTP + WebSocket server with pairing QR & dashboard UI
    ├── window/              # Native Chromium app-mode window launcher with browser fallback
    └── diagnostics/         # Self-test doctor verifying dependencies, display, and ports
```

---

## Quick Start (Desktop Server)

### Installation

```bash
git clone https://github.com/mohamedjs/remote-control.git
cd remote-control
npm install
```

### CLI Commands

```bash
# Open native desktop dashboard window
npm start
# Or using the binary directly:
./bin/remote-control.js dashboard

# Run background service (no window, for systemd / autostart)
./bin/remote-control.js run --no-window

# Run system diagnostic checks
./bin/remote-control.js doctor

# Print version
./bin/remote-control.js --version
```

### Testing

```bash
# Run all unit, integration, and architecture boundary tests
npm test

# Run modular monolith boundary validation specifically
npm run test:arch
```

---

## Mobile Companion App

The companion app is located in `app/` and built with Expo React Native.

```bash
cd app
npm install
npm start
```

Scan the QR code displayed on the desktop dashboard using Expo Go on iOS or Android. Both devices must be on the same local network (Wi-Fi).

---

## Cross-Platform Packaging

- **Linux (.deb & .tar.gz):**
  ```bash
  packaging/linux/build-bundle.sh 1.0.0
  packaging/linux/build-deb.sh 1.0.0 amd64
  ```
- **Windows (.exe installer & portable .zip):**
  Uses Inno Setup script at `packaging/windows/remote-control.iss`.
- **macOS (.app & Homebrew Cask):**
  Uses `packaging/macos/build-app.sh` and `packaging/homebrew/remote-control.rb.tmpl`.
- **Automated GitHub Releases:** Triggered on git tag `v*` via `.github/workflows/release.yml`.

---

## Static Landing Page

The zero-dependency bilingual landing page resides in `site/` and is deployed to GitHub Pages via `.github/workflows/pages.yml`:

```bash
site/build.sh
```

Live URL: **[https://mohamedjs.github.io/remote-control/](https://mohamedjs.github.io/remote-control/)**

---

## License

ISC License.
