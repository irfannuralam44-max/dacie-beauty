/**
 * Validasi environment server yang murni (tanpa membaca `process.env`).
 *
 * Modul ini sengaja tidak memakai penanda `server-only` agar dapat diuji
 * sebagai fungsi murni. Pembacaan `process.env` dilakukan di `server.ts`
 * yang wajib server-only.
 */

export type AppMode = "public" | "private";

export interface PublicServerEnv {
  readonly appMode: "public";
  readonly appPublicDatabaseUrl: string;
  readonly captchaSecret: string;
}

export interface PrivateServerEnv {
  readonly appMode: "private";
  readonly appPrivateDatabaseUrl: string;
  readonly sessionSecret: string;
}

export type ServerEnv = PublicServerEnv | PrivateServerEnv;

export const MIN_SECRET_LENGTH = 32;

const PUBLIC_REQUIRED_VARIABLES = [
  "APP_PUBLIC_DATABASE_URL",
  "CAPTCHA_SECRET",
] as const;

const PRIVATE_REQUIRED_VARIABLES = [
  "APP_PRIVATE_DATABASE_URL",
  "SESSION_SECRET",
] as const;

const PUBLIC_FORBIDDEN_VARIABLES = [
  "APP_PRIVATE_DATABASE_URL",
  "SESSION_SECRET",
] as const;

const PRIVATE_FORBIDDEN_VARIABLES = [
  "APP_PUBLIC_DATABASE_URL",
  "CAPTCHA_SECRET",
] as const;

/**
 * Error validasi environment. Pesan hanya memuat nama variabel dan aturan,
 * tidak pernah memuat nilai secret.
 */
export class EnvValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid server environment configuration:\n- ${issues.join("\n- ")}`);
    this.name = "EnvValidationError";
    this.issues = issues;
  }
}

export function parseAppMode(value: string | undefined): AppMode {
  if (value === "public" || value === "private") {
    return value;
  }

  throw new Error("APP_MODE must be set to 'public' or 'private'.");
}

/**
 * Memvalidasi environment server untuk mode yang diberikan.
 *
 * Aturan:
 * - `APP_MODE` wajib `public` atau `private`.
 * - Mode public wajib memiliki `APP_PUBLIC_DATABASE_URL` dan `CAPTCHA_SECRET`,
 *   serta tidak boleh memiliki credential/secret privat.
 * - Mode private wajib memiliki `APP_PRIVATE_DATABASE_URL` dan `SESSION_SECRET`,
 *   serta tidak boleh memiliki credential/secret publik.
 *
 * Nilai variabel tidak pernah dimasukkan ke pesan error.
 */
export function parseServerEnv(
  raw: Record<string, string | undefined>,
): ServerEnv {
  const appMode = parseAppMode(raw.APP_MODE);

  if (appMode === "public") {
    const issues: string[] = [];

    const appPublicDatabaseUrl = readRequired(
      raw,
      "APP_PUBLIC_DATABASE_URL",
      appMode,
      issues,
    );
    if (appPublicDatabaseUrl !== "") {
      validatePostgresUrl(
        "APP_PUBLIC_DATABASE_URL",
        appPublicDatabaseUrl,
        "app_public",
        issues,
      );
    }

    const captchaSecret = readRequired(
      raw,
      "CAPTCHA_SECRET",
      appMode,
      issues,
    );
    if (captchaSecret !== "") {
      validateSecret("CAPTCHA_SECRET", captchaSecret, issues);
    }

    rejectForbidden(raw, PUBLIC_FORBIDDEN_VARIABLES, appMode, issues);

    if (issues.length > 0) {
      throw new EnvValidationError(issues);
    }

    return {
      appMode,
      appPublicDatabaseUrl,
      captchaSecret,
    };
  }

  const issues: string[] = [];

  const appPrivateDatabaseUrl = readRequired(
    raw,
    "APP_PRIVATE_DATABASE_URL",
    appMode,
    issues,
  );
  if (appPrivateDatabaseUrl !== "") {
    validatePostgresUrl(
      "APP_PRIVATE_DATABASE_URL",
      appPrivateDatabaseUrl,
      "app_private",
      issues,
    );
  }

  const sessionSecret = readRequired(raw, "SESSION_SECRET", appMode, issues);
  if (sessionSecret !== "") {
    validateSecret("SESSION_SECRET", sessionSecret, issues);
  }

  rejectForbidden(raw, PRIVATE_FORBIDDEN_VARIABLES, appMode, issues);

  if (issues.length > 0) {
    throw new EnvValidationError(issues);
  }

  return {
    appMode,
    appPrivateDatabaseUrl,
    sessionSecret,
  };
}

export const REQUIRED_VARIABLES_BY_MODE = {
  public: PUBLIC_REQUIRED_VARIABLES,
  private: PRIVATE_REQUIRED_VARIABLES,
} as const;

export const FORBIDDEN_VARIABLES_BY_MODE = {
  public: PUBLIC_FORBIDDEN_VARIABLES,
  private: PRIVATE_FORBIDDEN_VARIABLES,
} as const;

function readRequired(
  raw: Record<string, string | undefined>,
  name: string,
  appMode: AppMode,
  issues: string[],
): string {
  const value = raw[name];

  if (value === undefined || value.trim() === "") {
    issues.push(`${name} is required when APP_MODE=${appMode}.`);
    return "";
  }

  return value;
}

function rejectForbidden(
  raw: Record<string, string | undefined>,
  names: readonly string[],
  appMode: AppMode,
  issues: string[],
): void {
  for (const name of names) {
    const value = raw[name];

    if (value !== undefined && value.trim() !== "") {
      issues.push(`${name} must not be set when APP_MODE=${appMode}.`);
    }
  }
}

function validatePostgresUrl(
  name: string,
  value: string,
  expectedUsername: string,
  issues: string[],
): void {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    issues.push(
      `${name} must be a valid PostgreSQL connection URL.`,
    );
    return;
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    issues.push(
      `${name} must use the postgres:// or postgresql:// protocol.`,
    );
    return;
  }

  if (parsed.username === "") {
    issues.push(`${name} must include a database username.`);
  } else if (parsed.username !== expectedUsername) {
    issues.push(
      `${name} must use the ${expectedUsername} database role.`,
    );
  }

  if (parsed.password === "") {
    issues.push(`${name} must include a database password.`);
  }

  if (parsed.pathname.length <= 1) {
    issues.push(`${name} must include a database name.`);
  }
}

function validateSecret(name: string, value: string, issues: string[]): void {
  if (value.length < MIN_SECRET_LENGTH) {
    issues.push(
      `${name} must be at least ${MIN_SECRET_LENGTH} characters long.`,
    );
  }
}
