import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  EnvValidationError,
  MIN_SECRET_LENGTH,
  parseAppMode,
  parseServerEnv,
} from "./schema.ts";

const PUBLIC_DATABASE_URL =
  "postgresql://app_public:change-me-local-only@db:5432/dacie_dev";
const PRIVATE_DATABASE_URL =
  "postgresql://app_private:change-me-local-only@db:5432/dacie_dev";
const CAPTCHA_SECRET = "change-me-local-only-captcha-secret";
const SESSION_SECRET = "change-me-local-only-session-secret";

const VALID_PUBLIC_ENV = {
  APP_MODE: "public",
  APP_PUBLIC_DATABASE_URL: PUBLIC_DATABASE_URL,
  CAPTCHA_SECRET,
};

const VALID_PRIVATE_ENV = {
  APP_MODE: "private",
  APP_PRIVATE_DATABASE_URL: PRIVATE_DATABASE_URL,
  SESSION_SECRET,
};

function expectValidationError(
  env: Record<string, string | undefined>,
  expectedPatterns: readonly RegExp[],
): EnvValidationError {
  try {
    parseServerEnv(env);
  } catch (error) {
    assert.ok(
      error instanceof EnvValidationError,
      "expected an EnvValidationError",
    );

    for (const pattern of expectedPatterns) {
      assert.match(error.message, pattern);
    }

    return error;
  }

  assert.fail("expected parseServerEnv to throw");
}

test("parseAppMode only accepts public or private", () => {
  assert.equal(parseAppMode("public"), "public");
  assert.equal(parseAppMode("private"), "private");
  assert.throws(() => parseAppMode(undefined), /APP_MODE/);
  assert.throws(() => parseAppMode(""), /APP_MODE/);
  assert.throws(() => parseAppMode("Public"), /APP_MODE/);
  assert.throws(() => parseAppMode("admin"), /APP_MODE/);
});

test("valid public environment is accepted", () => {
  const env = parseServerEnv(VALID_PUBLIC_ENV);

  assert.equal(env.appMode, "public");
  assert.equal(env.appPublicDatabaseUrl, PUBLIC_DATABASE_URL);
  assert.equal(env.captchaSecret, CAPTCHA_SECRET);
});

test("valid private environment is accepted", () => {
  const env = parseServerEnv(VALID_PRIVATE_ENV);

  assert.equal(env.appMode, "private");
  assert.equal(env.appPrivateDatabaseUrl, PRIVATE_DATABASE_URL);
  assert.equal(env.sessionSecret, SESSION_SECRET);
});

test("missing APP_MODE is rejected", () => {
  assert.throws(
    () =>
      parseServerEnv({
        APP_PUBLIC_DATABASE_URL: PUBLIC_DATABASE_URL,
        CAPTCHA_SECRET,
      }),
    /APP_MODE must be set to 'public' or 'private'/,
  );
});

test("invalid APP_MODE is rejected", () => {
  assert.throws(
    () =>
      parseServerEnv({
        ...VALID_PUBLIC_ENV,
        APP_MODE: "admin",
      }),
    /APP_MODE must be set to 'public' or 'private'/,
  );
});

test("public mode requires APP_PUBLIC_DATABASE_URL", () => {
  expectValidationError(
    {
      APP_MODE: "public",
      CAPTCHA_SECRET,
    },
    [/APP_PUBLIC_DATABASE_URL is required when APP_MODE=public/],
  );
});

test("public mode requires CAPTCHA_SECRET", () => {
  expectValidationError(
    {
      APP_MODE: "public",
      APP_PUBLIC_DATABASE_URL: PUBLIC_DATABASE_URL,
    },
    [/CAPTCHA_SECRET is required when APP_MODE=public/],
  );
});

test("public mode rejects a non-PostgreSQL URL protocol", () => {
  expectValidationError(
    {
      ...VALID_PUBLIC_ENV,
      APP_PUBLIC_DATABASE_URL: "https://db.example.test/dacie_dev",
    },
    [/APP_PUBLIC_DATABASE_URL must use the postgres:\/\/ or postgresql:\/\//],
  );
});

test("public mode rejects a malformed database URL", () => {
  expectValidationError(
    {
      ...VALID_PUBLIC_ENV,
      APP_PUBLIC_DATABASE_URL: "not-a-url",
    },
    [/APP_PUBLIC_DATABASE_URL must be a valid PostgreSQL connection URL/],
  );
});

test("public mode rejects a database URL without credentials", () => {
  expectValidationError(
    {
      ...VALID_PUBLIC_ENV,
      APP_PUBLIC_DATABASE_URL: "postgresql://db:5432/dacie_dev",
    },
    [
      /APP_PUBLIC_DATABASE_URL must include a database username/,
      /APP_PUBLIC_DATABASE_URL must include a database password/,
    ],
  );
});

test("public mode rejects a database URL without a database name", () => {
  expectValidationError(
    {
      ...VALID_PUBLIC_ENV,
      APP_PUBLIC_DATABASE_URL: "postgresql://app_public:secret@db:5432",
    },
    [/APP_PUBLIC_DATABASE_URL must include a database name/],
  );
});

test("public mode rejects a database URL with the wrong role", () => {
  for (const username of ["postgres", "app_private"]) {
    expectValidationError(
      {
        ...VALID_PUBLIC_ENV,
        APP_PUBLIC_DATABASE_URL: `postgresql://${username}:change-me-local-only@db:5432/dacie_dev`,
      },
      [new RegExp(`APP_PUBLIC_DATABASE_URL must use the app_public database role`)],
    );
  }
});

test("public mode rejects a CAPTCHA_SECRET that is too short", () => {
  expectValidationError(
    {
      ...VALID_PUBLIC_ENV,
      CAPTCHA_SECRET: "short-secret",
    },
    [new RegExp(`CAPTCHA_SECRET must be at least ${MIN_SECRET_LENGTH}`)],
  );
});

test("private mode requires APP_PRIVATE_DATABASE_URL", () => {
  expectValidationError(
    {
      APP_MODE: "private",
      SESSION_SECRET,
    },
    [/APP_PRIVATE_DATABASE_URL is required when APP_MODE=private/],
  );
});

test("private mode requires SESSION_SECRET", () => {
  expectValidationError(
    {
      APP_MODE: "private",
      APP_PRIVATE_DATABASE_URL: PRIVATE_DATABASE_URL,
    },
    [/SESSION_SECRET is required when APP_MODE=private/],
  );
});

test("private mode rejects a database URL with the wrong role", () => {
  for (const username of ["postgres", "app_public"]) {
    expectValidationError(
      {
        ...VALID_PRIVATE_ENV,
        APP_PRIVATE_DATABASE_URL: `postgresql://${username}:change-me-local-only@db:5432/dacie_dev`,
      },
      [new RegExp(`APP_PRIVATE_DATABASE_URL must use the app_private database role`)],
    );
  }
});

test("private mode rejects a SESSION_SECRET that is too short", () => {
  expectValidationError(
    {
      ...VALID_PRIVATE_ENV,
      SESSION_SECRET: "short-secret",
    },
    [new RegExp(`SESSION_SECRET must be at least ${MIN_SECRET_LENGTH}`)],
  );
});

test("public mode rejects private database credentials", () => {
  expectValidationError(
    {
      ...VALID_PUBLIC_ENV,
      APP_PRIVATE_DATABASE_URL: PRIVATE_DATABASE_URL,
    },
    [/APP_PRIVATE_DATABASE_URL must not be set when APP_MODE=public/],
  );
});

test("public mode rejects a private session secret", () => {
  expectValidationError(
    {
      ...VALID_PUBLIC_ENV,
      SESSION_SECRET,
    },
    [/SESSION_SECRET must not be set when APP_MODE=public/],
  );
});

test("private mode rejects public database credentials", () => {
  expectValidationError(
    {
      ...VALID_PRIVATE_ENV,
      APP_PUBLIC_DATABASE_URL: PUBLIC_DATABASE_URL,
    },
    [/APP_PUBLIC_DATABASE_URL must not be set when APP_MODE=private/],
  );
});

test("private mode rejects the public CAPTCHA secret", () => {
  expectValidationError(
    {
      ...VALID_PRIVATE_ENV,
      CAPTCHA_SECRET,
    },
    [/CAPTCHA_SECRET must not be set when APP_MODE=private/],
  );
});

test("empty forbidden variables are treated as absent", () => {
  const env = parseServerEnv({
    ...VALID_PUBLIC_ENV,
    APP_PRIVATE_DATABASE_URL: "",
    SESSION_SECRET: "   ",
  });

  assert.equal(env.appMode, "public");
});

test("validation errors never include secret values", () => {
  const sentinelPassword = "synthetic-password-sentinel-0123456789";
  const sentinelSecret = "synthetic-captcha-sentinel-0123456789";

  const error = expectValidationError(
    {
      ...VALID_PUBLIC_ENV,
      APP_PUBLIC_DATABASE_URL: `postgresql://app_public:${sentinelPassword}@db:5432`,
      CAPTCHA_SECRET: sentinelSecret.slice(0, 8),
    },
    [/APP_PUBLIC_DATABASE_URL/],
  );

  assert.doesNotMatch(error.message, new RegExp(sentinelPassword));
  assert.doesNotMatch(error.message, new RegExp(sentinelSecret.slice(0, 8)));
});

test("validation errors never include forbidden variable values", () => {
  const sentinelSecret = "synthetic-session-sentinel-0123456789";

  const error = expectValidationError(
    {
      ...VALID_PUBLIC_ENV,
      SESSION_SECRET: sentinelSecret,
    },
    [/SESSION_SECRET must not be set when APP_MODE=public/],
  );

  assert.doesNotMatch(error.message, new RegExp(sentinelSecret));
});

test("server configuration module is marked server-only", () => {
  const source = readFileSync(new URL("./server.ts", import.meta.url), "utf8");

  assert.match(source, /^import "server-only";/m);
  assert.doesNotMatch(source, /NEXT_PUBLIC_/);
});

test("startup instrumentation validates the server environment", () => {
  const source = readFileSync(
    new URL("../../instrumentation.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /assertServerEnv/);
  assert.match(source, /phase-production-build/);
});
