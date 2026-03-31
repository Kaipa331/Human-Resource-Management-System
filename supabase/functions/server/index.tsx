import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-37466ab9/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/make-server-37466ab9/integrations/surge/attendance", async (c) => {
  try {
    const payload = await c.req.json().catch(() => ({}));
    const surgeWebhookUrl = Deno.env.get("SURGE_WEBHOOK_URL") || Deno.env.get("SURGE_API_URL");
    const surgeApiKey = Deno.env.get("SURGE_API_KEY");

    if (!surgeWebhookUrl) {
      return c.json({ synced: false, reason: "Surge integration is not configured." });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (surgeApiKey) {
      headers.Authorization = `Bearer ${surgeApiKey}`;
    }

    const surgeResponse = await fetch(surgeWebhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "e-HRMS",
        event: payload?.event || "attendance.updated",
        data: payload,
      }),
    });

    const responseText = await surgeResponse.text();

    return c.json({
      synced: surgeResponse.ok,
      status: surgeResponse.status,
      response: responseText.slice(0, 500),
    }, surgeResponse.ok ? 200 : 502);
  } catch (error) {
    return c.json({
      synced: false,
      error: error instanceof Error ? error.message : "Unknown Surge sync error",
    }, 500);
  }
});

Deno.serve(app.fetch);