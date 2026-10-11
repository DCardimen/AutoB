import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const port = Number(process.env.PORT || 3000);
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".json": "application/json",
  ".woff2": "font/woff2",
};
const entryFiles = new Set([
  "/index.html",
  "/styles.css",
  "/app.js",
  "/game.js",
  "/art.js",
  "/skills.js",
  "/roster.js",
  "/animation.js",
  "/tactics.js",
  "/sound.js",
  "/Starfall-Menagerie.html",
]);
http
  .createServer((req, res) => {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, { Allow: "GET, HEAD" });
      return res.end();
    }
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
    } catch {
      res.writeHead(400);
      return res.end("Invalid path");
    }
    if (pathname === "/") pathname = "/index.html";
    if (!entryFiles.has(pathname) && !pathname.startsWith("/public/")) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const file = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403);
      return res.end();
    }
    if (
      pathname.startsWith("/public/") &&
      !file.startsWith(path.join(root, "public") + path.sep)
    ) {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end("Not found");
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    });
  })
  .listen(port, "0.0.0.0", () =>
    console.log(`Starfall Menagerie listening on ${port}`),
  );
