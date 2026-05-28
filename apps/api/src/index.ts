import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "@bunnystack/auth";

const app = new Elysia()
  .use(cors())
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  // Mount Better-Auth at /api/auth
  .all("/api/auth/*", async ({ request }) => {
    return auth.handler(request);
  })
  // Protected route - validates session
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
  .listen(3000);

console.log(`🦊 Bunnystack API running at ${app.server?.hostname}:${app.server?.port}`);