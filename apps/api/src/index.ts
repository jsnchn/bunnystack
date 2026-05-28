import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

const app = new Elysia()
  .use(cors())
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .listen(3000);

console.log(`🦊 Bunnystack API running at ${app.server?.hostname}:${app.server?.port}`);
