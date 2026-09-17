import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { handleFeedRequest } from "./server/funpay-feed.js";

/** Serves /api/funpay from the dev & preview servers (same shape as api/funpay.js). */
function funpayApiPlugin() {
  const attach = (server) => {
    server.middlewares.use("/api/funpay", (req, res) => {
      handleFeedRequest(req, res).catch((error) => {
        res.statusCode = 500;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: String(error?.message ?? error) }));
      });
    });
  };
  return {
    name: "funpay-api",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

export default defineConfig({
  plugins: [react(), funpayApiPlugin()],
  // allowedHosts: the IDE preview reaches the dev server through a reverse proxy with a
  // foreign Host header; without this Vite answers 403 and the preview is blank.
  server: { host: true, port: 5173, allowedHosts: true },
  preview: { host: true, port: 5173, allowedHosts: true },
});
