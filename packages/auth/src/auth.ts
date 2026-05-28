import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: {
    provider: "postgres",
    url: process.env.DATABASE_URL || "postgres://localhost:5432/bunnystack",
  },
  emailAndPassword: {
    enabled: true,
  },
});

export type Auth = typeof auth;