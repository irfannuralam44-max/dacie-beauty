/**
 * Lapisan akses data berbasis mode instance.
 *
 * Modul ini dibuat untuk digunakan hanya pada sisi server. Koneksi
 * database dipilih saat startup berdasarkan `APP_MODE`: instance public
 * hanya boleh membuat pool `app_public`; instance private hanya boleh
 * membuat pool `app_private`. Tidak ada fallback dan tidak ada cara untuk
 * memilih role/pool berdasarkan parameter request.
 *
 * Kredensial dibaca melalui `getServerEnv` dari `../env/server`, yang
 * sudah ditandai `server-only` dan tidak dapat diimpor ke Client
 * Component.
 */

import { Pool, type PoolClient, type QueryResult } from "pg";
import { parseServerEnv } from "../env/schema.ts";

let pool: Pool | undefined;

/**
 * Membuat pool PostgreSQL dari URL koneksi yang diberikan.
 *
 * Diekspor untuk keperluan pengujian unit; pool otomatis diambil dari
 * environment server melalui `getPool()` dalam produksi.
 */
export function createPool(connectionString: string): Pool {
  return new Pool({ connectionString });
}

/**
 * Mengembalikan pool database untuk mode instance yang aktif.
 *
 * Instance public selalu menggunakan `appPublicDatabaseUrl` (role
 * `app_public`); instance private selalu menggunakan
 * `appPrivateDatabaseUrl` (role `app_private`). Tidak ada fallback ke
 * role lain dan tidak ada opsi pemilihan berdasarkan request.
 */
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

/**
 * Menutup pool database. Diekspor untuk keperluan pengujian.
 */
export async function closePool(): Promise<void> {
  if (pool !== undefined) {
    await pool.end();
    pool = undefined;
  }
}

/**
 * Menjalankan query dengan parameter binding.
 *
 * Semua query harus menggunakan parameter binding ($1, $2, dst.); tidak
 * boleh menyusun SQL dari input mentah.
 */
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

/**
 * Menjalankan sejumlah query dalam satu transaksi.
 *
 * Jika salah satu query gagal, seluruh transaksi di-rollback. Error
 * dilemparkan ke pemanggil tanpa menyisipkan detail sensitif.
 */
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

/**
 * Mengembalikan URL koneksi yang digunakan oleh pool untuk mode aktif.
 * Diekspor untuk pengujian unit; tidak pernah mencetak nilai secret.
 */
export function getActiveConnectionString(): string {
  const env = parseServerEnv(process.env);
  return env.appMode === "public"
    ? env.appPublicDatabaseUrl
    : env.appPrivateDatabaseUrl;
}

/**
 * Mengembalikan role database yang digunakan oleh pool untuk mode aktif.
 * Diekspor untuk pengujian unit.
 */
export function getActiveRole(): string {
  const env = parseServerEnv(process.env);
  return env.appMode === "public" ? "app_public" : "app_private";
}

/**
 * Mengecek apakah mode aktif adalah public.
 */
export function isPublicPool(): boolean {
  return parseServerEnv(process.env).appMode === "public";
}

/**
 * Mengecek apakah mode aktif adalah private.
 */
export function isPrivatePool(): boolean {
  return parseServerEnv(process.env).appMode === "private";
}

export type { PoolClient, QueryResult };
