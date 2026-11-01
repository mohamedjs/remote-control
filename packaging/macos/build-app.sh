#!/usr/bin/env bash
# Assembles RemoteControl.app on macOS
set -euo pipefail

VERSION="${1:-1.0.0}"
ARCH="${2:-arm64}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
APP="$ROOT/dist/RemoteControl.app"

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources" "$APP/Contents/app"

cp -r "$ROOT/bin" "$ROOT/src" "$ROOT/decks" "$ROOT/package.json" "$APP/Contents/app/"
if [ -d "$ROOT/node_modules" ]; then
  cp -r "$ROOT/node_modules" "$APP/Contents/app/"
fi

# Entrypoint launcher executable
cat > "$APP/Contents/MacOS/remote-control" << 'EOF'
#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../app" && pwd)"
exec node "$DIR/bin/remote-control.js" "$@"
EOF
chmod +x "$APP/Contents/MacOS/remote-control"

# Info.plist
cat > "$APP/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>Remote Control</string>
  <key>CFBundleDisplayName</key>
  <string>Remote Control</string>
  <key>CFBundleIdentifier</key>
  <string>com.mohamedjs.remotecontrol</string>
  <key>CFBundleVersion</key>
  <string>$VERSION</string>
  <key>CFBundleShortVersionString</key>
  <string>$VERSION</string>
  <key>CFBundleExecutable</key>
  <string>remote-control</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
EOF

echo "Built $APP ($VERSION for $ARCH)"
