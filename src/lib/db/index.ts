/**
 * Ekspor publik lapisan akses data.
 *
 * Hanya fungsi dan tipe yang disediakan di sini yang boleh diimpor oleh
 * modul aplikasi. Tidak ada cara untuk memilih role/pool dari request.
 */

import {
  closePool,
  getActiveConnectionString,
  getActiveRole,
  getPool,
  isPrivatePool,
  isPublicPool,
  query,
  transaction,
} from "./pool.ts";
import { modify, select, selectOne } from "./client.ts";
import type { QueryResult } from "pg";
import type { ServerEnv } from "../env/schema.ts";

export {
  closePool,
  getActiveConnectionString,
  getActiveRole,
  getPool,
  isPrivatePool,
  isPublicPool,
  query,
  transaction,
};
export type { ServerEnv };
export { modify, select, selectOne };
export type { QueryResult };
