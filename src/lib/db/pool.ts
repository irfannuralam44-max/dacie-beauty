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

import { Pool, type PoolClient, type QueryResult } from "pg";
import { parseServerEnv } from "../env/schema.ts";

let pool: Pool | undefined;

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
  const client = await getPool().connect();
  try {
    if (params === undefined) {
      return await client.query<T>(text);
    }
    return await client.query<T>(text, params as unknown[]);
  } finally {
    client.release();
  }
}

export async function transaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export function isPublicPool(): boolean {
  return parseServerEnv(process.env).appMode === "public";
}

export function isPrivatePool(): boolean {
  return parseServerEnv(process.env).appMode === "private";
}

export type { PoolClient, QueryResult };
