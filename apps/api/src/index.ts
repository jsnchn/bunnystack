import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { auth } from "@bunnystack/auth";
import path from "path";

const WEB_DIST = path.resolve(import.meta.dir, "../../web/dist");

const app = new Elysia()
  .use(cors())
  .use(
    staticPlugin({
      assets: WEB_DIST,
      prefix: "/",
      alwaysStatic: false,
    })
  )
  // Health
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  // Better-Auth
  .all("/api/auth/*", async ({ request }) => {
    return auth.handler(request);
  })
  // Protected route
  .get("/api/protected", async ({ request }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return {
      message: "You are authenticated!",
      user: session.user,
      session: session.session,
    };
  })
  // SPA fallback — serve index.html for non-API, non-file routes
  .all("/*", async ({ request }) => {
    // If the static plugin already handled it, skip
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return;

    const file = Bun.file(`${WEB_DIST}/index.html`);
    return new Response(await file.text(), {
      headers: { "Content-Type": "text/html" },
    });
  })
  .listen(3000);

console.log(`🦊 Bunnystack API running at ${app.server?.hostname}:${app.server?.port}`);
