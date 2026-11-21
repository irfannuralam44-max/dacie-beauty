/**
 * Lapisan akses data berbasis mode instance.
 *
 * Kredensial dibaca melalui `parseServerEnv` dari `../env/schema.ts` (fungsi
 * yang juga dipakai oleh `getServerEnv` di `../env/server`). Pemilihan pool
 * ditentukan oleh `APP_MODE`: instance public hanya boleh membuat pool
 * `app_public`; instance private hanya boleh membuat pool `app_private`.
 * Tidak ada fallback dan tidak ada cara untuk memilih role/pool berdasarkan
 * parameter request.
 *
 * Modul ini adalah implementasi internal. API publik yang dilindungi
 * `server-only` ada di `index.ts`.
 */

import "server-only";

import { Pool, type PoolClient, type QueryResult } from "pg";
import { parseServerEnv } from "../env/schema.ts";

let pool: Pool | undefined;

/**
 * Membersihkan pesan error database sebelum dilewatkan ke pemanggil.
 *
 * Mencegah bocornya detail internal (nama skema, tabel, kolom, kode status
 * SQL, dsb.) ke respons publik. Error asli tetap tersedia melalui
 * `error.cause` untuk diagnostik sisi server.
 */
function sanitizeDatabaseError(error: unknown): Error {
  if (error instanceof Error) {
    return new Error("Terjadi kesalahan database", { cause: error });
  }
  return new Error("Terjadi kesalahan database", { cause: String(error) });
}

function createPool(connectionString: string): Pool {
  return new Pool({ connectionString });
}

export function getPool(): Pool {
  if (pool === undefined) {
    const env = parseServerEnv(process.env);
    const connectionString =
      env.appMode === "public"
        ? env.appPublicDatabaseUrl
        : env.appPrivateDatabaseUrl;
    pool = createPool(connectionString);
  }

  return pool;
}

export async function closePool(): Promise<void> {
  if (pool !== undefined) {
    await pool.end();
    pool = undefined;
  }
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: readonly unknown[],
): Promise<QueryResult<T>> {
  let client: PoolClient | undefined;
  try {
    client = await getPool().connect();
    if (params === undefined) {
      return await client.query<T>(text);
    }
    return await client.query<T>(text, params as unknown[]);
  } catch (error) {
    throw sanitizeDatabaseError(error);
  } finally {
    if (client !== undefined) {
      client.release();
    }
  }
}

export async function transaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  let client: PoolClient | undefined;
  try {
    client = await getPool().connect();
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    if (client !== undefined) {
      await client.query("ROLLBACK").catch(() => {});
    }
    throw sanitizeDatabaseError(error);
  } finally {
    if (client !== undefined) {
      client.release();
    }
  }
}

export function isPublicPool(): boolean {
  return parseServerEnv(process.env).appMode === "public";
}

export function isPrivatePool(): boolean {
  return parseServerEnv(process.env).appMode === "private";
}

export type { PoolClient, QueryResult };
