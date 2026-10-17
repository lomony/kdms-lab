#!/usr/bin/env bash
# Re-runs every KDMS PDF Merger v2 test. Usage: bash run-all.sh [URL]
# Default: serves ../../.. (the repo root) locally with production-like headers and tests /asec/v2/.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; APPDIR="$(cd "$HERE/../.." && pwd)"; ROOT="$(cd "$APPDIR/../.." && pwd)"
export FX="${FX:-$HERE/.fixtures}" APPDIR; OUT="$HERE/../results/run-$(date +%Y%m%d-%H%M%S)"; mkdir -p "$FX" "$OUT"
cd "$HERE"
[ -d node_modules ] || npm install --no-audit --no-fund
npx playwright install chromium firefox webkit        # add: npx playwright install msedge (optional), --with-deps on a fresh Linux box
python3 -m pip install -q -r requirements.txt 2>/dev/null || pip install -q --break-system-packages -r requirements.txt
(cd "$FX" && python3 "$HERE/gen.py" && python3 "$HERE/gen_actions.py")
export FU="${FU:-$FX/uat}"; mkdir -p "$FU"; (cd "$FU" && python3 "$HERE/gen_uat.py")
URL="${1:-}"
if [ -z "$URL" ]; then
  PORT=8821 SITE_ROOT="$ROOT" python3 "$HERE/hsrv.py" & SRV=$!; trap 'kill $SRV 2>/dev/null || true' EXIT; sleep 1
  URL="http://localhost:8821/asec/v2/"
fi
for BT in chromium firefox webkit; do BT=$BT node m.js "$(BT=$BT node cases.js "$URL" edge)" "$OUT/edge-$BT.json"; done
node m.js "$(node cases.js "$URL" xb)" "$OUT/cross-browser.json"
node act.js "$URL" | tee "$OUT/actions-duplicates.txt"
node dup.js "$URL" | tee "$OUT/dedupe-file-protocol.txt"
node uat.js "$URL" "$OUT/uat-extra.json" | tee "$OUT/uat-extra.txt"
python3 "$HERE/gen_codecs.py" "$FX/codecs" >/dev/null
node codecs.js "$URL" "$FX/codecs" "$OUT/codecs.json" | tee "$OUT/codecs.txt"
python3 "$HERE/gen_secfx.py" "$FX/sec" >/dev/null
node sec.js "$URL" "$OUT/sec.json" "$FX/sec" ${FRAMER:-} | tee "$OUT/sec.txt"
mkdir -p "$FX/f51"; for i in $(seq -w 1 51); do { cat "$FX/sec/a.pdf"; printf "%s" "$i"; } > "$FX/f51/f$i.pdf"; done
node limit50.js "$URL" "$FX/f51" | tee "$OUT/limit50.txt"
echo "Results in $OUT"
