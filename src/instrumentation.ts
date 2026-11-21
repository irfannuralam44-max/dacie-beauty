/**
 * Validasi environment saat startup.
 *
 * Build produksi tidak memerlukan secret runtime (satu build dipakai untuk
 * kedua mode), sehingga validasi dilewati pada fase build. Validasi berjalan
 * saat server benar-benar dijalankan.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  try {
    const { assertServerEnv } = await import("./lib/env/server");
    assertServerEnv();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Invalid server environment configuration.";

    console.error(message);
    process.exit(1);
  }
}
