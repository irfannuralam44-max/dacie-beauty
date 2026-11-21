import assert from "node:assert/strict";
import test from "node:test";

import {
  getActiveConnectionString,
  getActiveRole,
  getPool,
  isPrivatePool,
  isPublicPool,
} from "./pool.ts";

function expectRole(connectionString: string, role: string): void {
  assert.match(connectionString, new RegExp(`://${role}:`));
}

test("getPool mengembalikan Pool dengan connection string sesuai mode", () => {
  const pool = getPool();
  const cs = (pool as { options: { connectionString: string } }).options
    .connectionString;
  const role = getActiveRole();
  expectRole(cs, role);
  assert.equal(getActiveConnectionString(), cs);
});

test("getActiveRole mengembalikan role sesuai mode aktif", () => {
  const role = getActiveRole();
  assert.ok(role === "app_public" || role === "app_private", `role tidak dikenal: ${role}`);
  const cs = getActiveConnectionString();
  expectRole(cs, role);
});

test("isPublicPool dan isPrivatePool konsisten dengan mode aktif", () => {
  const role = getActiveRole();
  if (role === "app_public") {
    assert.equal(isPublicPool(), true);
    assert.equal(isPrivatePool(), false);
  } else if (role === "app_private") {
    assert.equal(isPublicPool(), false);
    assert.equal(isPrivatePool(), true);
  } else {
    assert.fail(`role tidak dikenal: ${role}`);
  }
});

test("tidak ada fallback ke role lain", () => {
  const role = getActiveRole();
  const cs = getActiveConnectionString();
  const otherRole = role === "app_public" ? "app_private" : "app_public";
  assert.ok(!cs.includes(`://${otherRole}:`));
});

test("pool memiliki opsi connectionString yang valid", () => {
  const pool = getPool();
  const cs = (pool as { options: { connectionString: string } }).options
    .connectionString;
  assert.match(cs, /^postgresql?:\/\//);
  assert.match(cs, /@/);
  assert.match(cs, /:\d+\//);
});
