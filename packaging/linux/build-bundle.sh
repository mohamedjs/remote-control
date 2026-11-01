#!/usr/bin/env bash
# Assembles standalone production bundle in dist/remote-control
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
DIST="$ROOT/dist/remote-control"

echo "Assembling bundle in $DIST..."
rm -rf "$DIST"
mkdir -p "$DIST/bin" "$DIST/src" "$DIST/decks"

cp -r "$ROOT/bin/." "$DIST/bin/"
cp -r "$ROOT/src/." "$DIST/src/"
cp -r "$ROOT/decks/." "$DIST/decks/"
cp "$ROOT/package.json" "$DIST/"

# Install or copy production dependencies
if [ -d "$ROOT/node_modules" ]; then
  cp -r "$ROOT/node_modules" "$DIST/"
fi

# Create root launcher script
cat > "$DIST/remote-control" << 'EOF'
#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$DIR/bin/remote-control.js" "$@"
EOF
chmod +x "$DIST/remote-control" "$DIST/bin/remote-control.js"

echo "Bundle built successfully in $DIST"
