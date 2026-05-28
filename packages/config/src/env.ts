const DEFAULT_DATABASE_URL = "postgres://bunnystack:bunnystack@localhost:5432/bunnystack";
const DEFAULT_BETTER_AUTH_SECRET = "replace-with-a-random-secret";
const DEFAULT_GOOGLE_CLIENT_ID = "replace-with-your-google-client-id";
const DEFAULT_GOOGLE_CLIENT_SECRET = "replace-with-your-google-client-secret";

function validateEnv() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";

  if (isProduction) {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL === DEFAULT_DATABASE_URL) {
      throw new Error(
        "FATAL: DATABASE_URL must be set to a real database URL in production. " +
        "The default value is only for development."
      );
    }
    if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET === DEFAULT_BETTER_AUTH_SECRET) {
      throw new Error(
        "FATAL: BETTER_AUTH_SECRET must be set to a real secret in production. " +
        "The default value is only for development."
      );
    }
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === DEFAULT_GOOGLE_CLIENT_ID) {
      throw new Error(
        "FATAL: GOOGLE_CLIENT_ID must be set to a real Google OAuth client ID in production. " +
        "The default value is only for development."
      );
    }
    if (!process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET === DEFAULT_GOOGLE_CLIENT_SECRET) {
      throw new Error(
        "FATAL: GOOGLE_CLIENT_SECRET must be set to a real Google OAuth client secret in production. " +
        "The default value is only for development."
      );
    }
  } else {
    if (process.env.DATABASE_URL === DEFAULT_DATABASE_URL || !process.env.DATABASE_URL) {
      console.warn(
        "[env] WARNING: Using default DATABASE_URL. This is fine for development but " +
        "must be changed in production."
      );
    }
    if (process.env.BETTER_AUTH_SECRET === DEFAULT_BETTER_AUTH_SECRET || !process.env.BETTER_AUTH_SECRET) {
      console.warn(
        "[env] WARNING: Using default BETTER_AUTH_SECRET. This is fine for development but " +
        "must be changed in production."
      );
    }
    if (process.env.GOOGLE_CLIENT_ID === DEFAULT_GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_ID) {
      console.warn(
        "[env] WARNING: Using default GOOGLE_CLIENT_ID. This is fine for development but " +
        "must be changed in production."
      );
    }
    if (process.env.GOOGLE_CLIENT_SECRET === DEFAULT_GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CLIENT_SECRET) {
      console.warn(
        "[env] WARNING: Using default GOOGLE_CLIENT_SECRET. This is fine for development but " +
        "must be changed in production."
      );
    }
  }
}

export const env = {
  get DATABASE_URL(): string {
    return process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  },
  get PORT(): number {
    return parseInt(process.env.PORT || "3000", 10);
  },
  get NODE_ENV(): string {
    return process.env.NODE_ENV || "development";
  },
  get BETTER_AUTH_SECRET(): string {
    return process.env.BETTER_AUTH_SECRET || DEFAULT_BETTER_AUTH_SECRET;
  },
  get BETTER_AUTH_URL(): string {
    return process.env.BETTER_AUTH_URL || "http://localhost:3000";
  },
  get GOOGLE_CLIENT_ID(): string {
    return process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
  },
  get GOOGLE_CLIENT_SECRET(): string {
    return process.env.GOOGLE_CLIENT_SECRET || DEFAULT_GOOGLE_CLIENT_SECRET;
  },
  get isDevelopment(): boolean {
    return this.NODE_ENV === "development";
  },
  get isProduction(): boolean {
    return this.NODE_ENV === "production";
  },
};

// Run validation at import time
validateEnv();