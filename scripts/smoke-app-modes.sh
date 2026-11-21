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
  if [[ "$mode" == "public" ]]; then
    APP_MODE=public \
      APP_PUBLIC_DATABASE_URL='postgresql://app_public:change-me-local-only@127.0.0.1:5432/dacie_dev' \
      CAPTCHA_SECRET='change-me-local-only-captcha-secret' \
      npm run start >"$log" 2>&1 &
  else
    APP_MODE=private \
      APP_PRIVATE_DATABASE_URL='postgresql://app_private:change-me-local-only@127.0.0.1:5432/dacie_dev' \
      SESSION_SECRET='change-me-local-only-session-secret' \
      npm run start >"$log" 2>&1 &
  fi
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

expect_fail_closed() {
  local label="$1"
  shift
  local log="/tmp/dacie-smoke-${label}.log"
  "$@" >"$log" 2>&1 &
  local pid=$!
  sleep 6
  local status
  status="$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || true)"
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
  fuser -k 3000/tcp >/dev/null 2>&1 || true
  sleep 1
  if [[ "$status" != "000" && "$status" != "404" && "$status" != "500" && "$status" != "503" ]]; then
    echo "ASSERT FAILED: $label expected fail-closed got $status" >&2
    cat "$log" >&2
    return 1
  fi
  if ! grep -qE "Invalid server environment configuration|APP_MODE must be set to 'public' or 'private'" "$log"; then
    echo "ASSERT FAILED: $label did not log a safe startup error" >&2
    cat "$log" >&2
    return 1
  fi
  echo "OK: $label failed closed (HTTP $status)"
}

ENV_BACKUP=""
if [[ -f .env ]]; then
  mv .env .env.smoke-backup
  ENV_BACKUP=".env.smoke-backup"
fi

trap 'stop_server; if [[ -n "${ENV_BACKUP}" && -f "${ENV_BACKUP}" ]]; then mv "${ENV_BACKUP}" .env; fi' EXIT

echo "=== Build once without APP_MODE ==="
env -u APP_MODE npm run build

echo "=== Run same build: APP_MODE=public ==="
start_server public /tmp/dacie-smoke-public.log
assert_status 200 http://localhost:3000/
assert_status 200 http://localhost:3000/api/health
assert_status 200 http://localhost:3000/booking
assert_status 404 http://localhost:3000/rekam
grep -q "Mode aplikasi: public" <(curl -s http://localhost:3000/)
stop_server

echo "=== Run same build: APP_MODE=private ==="
start_server private /tmp/dacie-smoke-private.log
assert_status 200 http://localhost:3000/
assert_status 200 http://localhost:3000/api/health
assert_status 200 http://localhost:3000/rekam
assert_status 404 http://localhost:3000/booking
grep -q "Mode aplikasi: private" <(curl -s http://localhost:3000/)
stop_server

echo "=== Run same build: APP_MODE=invalid (must fail closed) ==="
expect_fail_closed invalid env APP_MODE=invalid npm run start

echo "=== Run same build: public with missing CAPTCHA_SECRET (must fail closed) ==="
expect_fail_closed missing-captcha env APP_MODE=public APP_PUBLIC_DATABASE_URL='postgresql://app_public:change-me-local-only@127.0.0.1:5432/dacie_dev' npm run start

echo "=== Run same build: public with forbidden SESSION_SECRET (must fail closed) ==="
expect_fail_closed forbidden-public env APP_MODE=public APP_PUBLIC_DATABASE_URL='postgresql://app_public:change-me-local-only@127.0.0.1:5432/dacie_dev' CAPTCHA_SECRET='change-me-local-only-captcha-secret' SESSION_SECRET='change-me-local-only-session-secret' npm run start

echo "=== Run same build: private with forbidden CAPTCHA_SECRET (must fail closed) ==="
expect_fail_closed forbidden-private env APP_MODE=private APP_PRIVATE_DATABASE_URL='postgresql://app_private:change-me-local-only@127.0.0.1:5432/dacie_dev' SESSION_SECRET='change-me-local-only-session-secret' CAPTCHA_SECRET='change-me-local-only-captcha-secret' npm run start

echo "ALL SMOKE CHECKS PASSED"
