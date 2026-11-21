import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  closePool,
  getPool,
  isPrivatePool,
  isPublicPool,
} from "./pool.ts";

test("getPool mengembalikan Pool dengan connection string valid", () => {
  const pool = getPool();
  assert.ok(pool);
});

test("isPublicPool dan isPrivatePool konsisten dan saling eksklusif", () => {
  const pub = isPublicPool();
  const pri = isPrivatePool();
  assert.ok(pub !== pri, "salah satu mode harus aktif");
  assert.equal(pub, !pri);
});

test("getPool mengembalikan instance yang sama (singleton)", () => {
  const pool1 = getPool();
  const pool2 = getPool();
  assert.equal(pool1, pool2);
});

test("API publik tidak mengekspos createPool (tidak boleh menerima DSN arbitrer)", () => {
  const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\bcreatePool\b/);
});

test("API publik tidak mengekspos getActiveConnectionString (DSN tidak boleh bocor)", () => {
  const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\bgetActiveConnectionString\b/);
});

test("API publik tidak mengekspos getActiveRole (nama role tidak boleh bocor)", () => {
  const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\bgetActiveRole\b/);
});

test("closePool menutup pool dan getPool membuat pool baru", async () => {
  await closePool();
  const pool = getPool();
  assert.ok(pool);
  await closePool();
});
