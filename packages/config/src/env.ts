export const env = {
  get DATABASE_URL(): string {
    return process.env.DATABASE_URL || "postgres://localhost:5432/bunnystack";
  },
  get PORT(): number {
    return parseInt(process.env.PORT || "3000", 10);
  },
  get NODE_ENV(): string {
    return process.env.NODE_ENV || "development";
  },
  get isDevelopment(): boolean {
    return this.NODE_ENV === "development";
  },
  get isProduction(): boolean {
    return this.NODE_ENV === "production";
  },
};
