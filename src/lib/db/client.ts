/**
 * Klien query berparameter untuk lapisan akses data.
 *
 * Re-eksport fungsi `query` dan `transaction` dari `pool.ts` dengan
 * penambahan tipe wrapper agar pemanggil tetap menggunakan parameter
 * binding dan tidak menyusun SQL secara mentah.
 */

import { type QueryResult } from "pg";

import { query, transaction } from "./pool.ts";

export { query, transaction };

export type { QueryResult };

export async function select<T extends Record<string, unknown>>(
  text: string,
  params?: readonly unknown[],
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

export async function modify(
  text: string,
  params?: readonly unknown[],
): Promise<QueryResult> {
  return query(text, params);
}

export async function selectOne<T extends Record<string, unknown>>(
  text: string,
  params?: readonly unknown[],
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}
