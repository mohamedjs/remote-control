#!/usr/bin/env bash
# Assemble the Remote Control landing page into _site/ for GitHub Pages.
set -euo pipefail

REPO="mohamedjs/remote-control"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/_site"

rm -rf "$OUT"
mkdir -p "$OUT/assets"

cp "$ROOT/site/index.html" "$ROOT/site/site.css" "$ROOT/site/site.js" "$OUT/"
if [ -d "$ROOT/site/assets" ]; then
  cp -r "$ROOT/site/assets/." "$OUT/assets/"
fi
if [ -d "$ROOT/packaging/icons" ]; then
  cp -r "$ROOT/packaging/icons/." "$OUT/assets/" 2>/dev/null || true
fi

# Query latest release info if available
if command -v curl >/dev/null; then
  auth=()
  [ -n "${GITHUB_TOKEN:-}" ] && auth=(-H "Authorization: Bearer $GITHUB_TOKEN")
  curl -fsSL "${auth[@]}" "https://api.github.com/repos/$REPO/releases/latest" -o "$OUT/release.json" 2>/dev/null \
    || echo "warning: no release.json; page will query GitHub API dynamically"
fi

touch "$OUT/.nojekyll"
echo "Built $OUT ($(du -sh "$OUT" | cut -f1))"
