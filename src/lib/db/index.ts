/**
 * Ekspor publik lapisan akses data.
 *
 * Modul ini ditandai `server-only` sehingga tidak dapat diimpor ke Client
 * Component atau masuk ke client bundle. Hanya fungsi dan tipe yang
 * disediakan di sini yang boleh diimpor oleh modul aplikasi. Tidak ada
 * cara untuk memilih role/pool berdasarkan request, dan DSN lengkap tidak
 * diekspor melalui API publik.
 */

import "server-only";

import {
  closePool,
  getPool,
  isPrivatePool,
  isPublicPool,
  query,
  transaction,
} from "./pool.ts";
import { modify, select, selectOne } from "./client.ts";
import type { QueryResult } from "pg";

export {
  closePool,
  getPool,
  isPrivatePool,
  isPublicPool,
  query,
  transaction,
};
export { modify, select, selectOne };
export type { QueryResult };
