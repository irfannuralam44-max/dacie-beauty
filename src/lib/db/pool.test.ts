import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  closePool,
  getPool,
  isPrivatePool,
  isPublicPool,
  query,
  transaction,
  type PoolClient,
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

test("query() dan transaction() melempar error tersanitasi dan tidak release() saat pool.connect() gagal", async () => {
  const targetPool = getPool();
  const originalConnect = targetPool.connect;

  targetPool.connect = (async () => {
    throw new Error("Koneksi ditolak oleh stub");
  }) as unknown as typeof targetPool.connect;

  try {
    await assert.rejects(
      async () => {
        await query("SELECT 1");
      },
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "Terjadi kesalahan database");
        assert.ok(error.cause instanceof Error);
        assert.equal((error.cause as Error).message, "Koneksi ditolak oleh stub");
        // Memastikan tidak ada release() pada client undefined (tidak melempar TypeError)
        assert.notEqual((error.cause as Error).name, "TypeError");
        return true;
      },
    );

    await assert.rejects(
      async () => {
        await transaction(async () => {});
      },
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "Terjadi kesalahan database");
        assert.ok(error.cause instanceof Error);
        assert.equal((error.cause as Error).message, "Koneksi ditolak oleh stub");
        // Memastikan tidak ada release() pada client undefined (tidak melempar TypeError)
        assert.notEqual((error.cause as Error).name, "TypeError");
        return true;
      },
    );
  } finally {
    targetPool.connect = originalConnect;
  }
});

test("kegagalan BEGIN pada transaction() tidak memicu ROLLBACK dan client tetap di-release", async () => {
  const targetPool = getPool();
  const originalConnect = targetPool.connect;
  const queriesCalled: string[] = [];
  let releaseCalled = false;

  const mockClient = {
    query: async (text: string) => {
      queriesCalled.push(text);
      if (text === "BEGIN") {
        throw new Error("Gagal mengeksekusi BEGIN");
      }
      return { rows: [] };
    },
    release: () => {
      releaseCalled = true;
    },
  } as unknown as PoolClient;

  targetPool.connect = (async () => mockClient) as unknown as typeof targetPool.connect;

  try {
    await assert.rejects(
      async () => {
        await transaction(async () => "ok");
      },
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "Terjadi kesalahan database");
        assert.ok(error.cause instanceof Error);
        assert.equal((error.cause as Error).message, "Gagal mengeksekusi BEGIN");
        return true;
      },
    );

    assert.deepEqual(queriesCalled, ["BEGIN"]);
    assert.equal(
      queriesCalled.includes("ROLLBACK"),
      false,
      "kegagalan BEGIN tidak boleh memicu ROLLBACK",
    );
    assert.equal(releaseCalled, true, "client tetap di-release");
  } finally {
    targetPool.connect = originalConnect;
  }
});

test("kegagalan setelah BEGIN berhasil pada transaction() tetap memicu ROLLBACK dan client di-release", async () => {
  const targetPool = getPool();
  const originalConnect = targetPool.connect;
  const queriesCalled: string[] = [];
  let releaseCalled = false;

  const mockClient = {
    query: async (text: string) => {
      queriesCalled.push(text);
      return { rows: [] };
    },
    release: () => {
      releaseCalled = true;
    },
  } as unknown as PoolClient;

  targetPool.connect = (async () => mockClient) as unknown as typeof targetPool.connect;

  try {
    await assert.rejects(
      async () => {
        await transaction(async () => {
          throw new Error("Gagal di tengah proses transaksi");
        });
      },
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "Terjadi kesalahan database");
        assert.ok(error.cause instanceof Error);
        assert.equal((error.cause as Error).message, "Gagal di tengah proses transaksi");
        return true;
      },
    );

    assert.deepEqual(queriesCalled, ["BEGIN", "ROLLBACK"]);
    assert.equal(
      queriesCalled.includes("ROLLBACK"),
      true,
      "kegagalan setelah BEGIN harus memicu ROLLBACK",
    );
    assert.equal(releaseCalled, true, "client tetap di-release");
  } finally {
    targetPool.connect = originalConnect;
  }
});
