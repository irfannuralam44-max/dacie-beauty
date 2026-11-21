#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

assert_status() {
  local expected="$1"
  local url="$2"
  local actual
  actual="$(curl -s -o /dev/null -w "%{http_code}" "$url")"
  if [[ "$actual" != "$expected" ]]; then
    echo "ASSERT FAILED: $url expected $expected got $actual" >&2
    return 1
  fi
  echo "OK: $url -> $actual"
}

start_server() {
  local mode="$1"
  local log="$2"
  APP_MODE="$mode" npm run start >"$log" 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 30); do
    if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
      return 0
    fi
    sleep 1
  done
  echo "Server did not become ready" >&2
  cat "$log" >&2
  return 1
}

stop_server() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
    unset SERVER_PID
  fi
  fuser -k 3000/tcp >/dev/null 2>&1 || true
  sleep 1
}

trap stop_server EXIT

echo "=== Build without APP_MODE ==="
env -u APP_MODE npm run build

echo "=== Mode: public ==="
APP_MODE=public npm run build
start_server public /tmp/dacie-smoke-public.log
assert_status 200 http://localhost:3000/
assert_status 200 http://localhost:3000/booking
assert_status 404 http://localhost:3000/rekam
grep -q "Mode aplikasi: public" <(curl -s http://localhost:3000/)
stop_server

echo "=== Mode: private ==="
APP_MODE=private npm run build
start_server private /tmp/dacie-smoke-private.log
assert_status 200 http://localhost:3000/
assert_status 200 http://localhost:3000/rekam
assert_status 404 http://localhost:3000/booking
grep -q "Mode aplikasi: private" <(curl -s http://localhost:3000/)
stop_server

echo "=== Mode: invalid (must fail closed) ==="
APP_MODE=invalid npm run build
APP_MODE=invalid npm run start > /tmp/dacie-smoke-invalid.log 2>&1 &
INVALID_PID=$!
sleep 6
INVALID_STATUS="$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || true)"
kill "$INVALID_PID" 2>/dev/null || true
wait "$INVALID_PID" 2>/dev/null || true
grep -q "APP_MODE must be set to 'public' or 'private'" /tmp/dacie-smoke-invalid.log
if [[ "$INVALID_STATUS" != "404" && "$INVALID_STATUS" != "500" ]]; then
  echo "ERROR: invalid mode returned unexpected status $INVALID_STATUS" >&2
  exit 1
fi
echo "OK: invalid APP_MODE is fail-closed (HTTP $INVALID_STATUS)"

echo "ALL SMOKE CHECKS PASSED"