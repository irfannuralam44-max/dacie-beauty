import "server-only";

import { parseServerEnv, type ServerEnv } from "./schema";

let cachedServerEnv: ServerEnv | undefined;

/**
 * Membaca dan memvalidasi environment server satu kali per proses.
 *
 * Modul ini ditandai `server-only` sehingga tidak dapat diimpor ke Client
 * Component atau masuk ke client bundle.
 */
export function getServerEnv(): ServerEnv {
  if (cachedServerEnv === undefined) {
    cachedServerEnv = parseServerEnv(process.env);
  }

  return cachedServerEnv;
}

/**
 * Dipakai pada startup untuk menggagalkan proses bila konfigurasi tidak sah.
 */
export function assertServerEnv(): ServerEnv {
  return getServerEnv();
}
