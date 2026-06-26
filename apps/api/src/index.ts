import type { Request } from "express";
import express from "express";
import routes from "./routes/index.js";

const app = express();
const port = process.env.PORT ?? 3001;

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-EDM-User-Id, x-actor-name, x-actor-role");
  if (_req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});
app.use((req, _res, next) => {
  const userId = req.header("X-EDM-User-Id");
  if (userId) (req as Request & { userId?: string }).userId = userId;
  next();
});
app.use(express.json());
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", routes);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
