/**
 * Serverless entry (Vercel / Netlify-style Node function) for the FunPay feed.
 * Mirrors the Vite dev middleware so `/api/funpay` works in production too.
 */
import { buildFeedResponse } from "../server/funpay-feed.js";

export default async function handler(req, res) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const { status, body } = await buildFeedResponse(Object.fromEntries(url.searchParams));
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}
