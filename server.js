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
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".json": "application/json",
  ".woff2": "font/woff2",
};
const entryFiles = new Set([
  "/rarity-aura.js", "/capture-celebration.js",
  "/modal-content.js", "/capture-tracker.js",
  "/equipment-affinity.js", "/affinity-gear.js", "/opening-relics.js", "/relic-selection-ui.js", "/relic-pacts.js", "/relic-illustrations.js",
  "/movement-tuning.js",
  "/settings-movement-preview.js",
  "/elite-modifiers.js",
  "/starter-reactions.js",
  "/intro.js",
  "/portrait-expressions.js",
  "/authored-arm-skin.js",
  "/index.html",
  "/styles.css",
  "/field-ui.css",
  "/uploaded-ui.css",
  "/ui-art.js",
  "/ui-art-assets.js",
  "/rewards-ui.js",
  "/relic-ui.js",
  "/ambient-art.js",
  "/arena-camera.js",
  "/ambient-ui.js",
  "/journey-polish.css",
  "/field-ui.js",
  "/app.js",
  "/game.js",
  "/wearer-relics.js",
  "/planet-ui.js",
  "/native-motion.js",
  "/battle-enrage.js",
  "/tuning.js",
  "/battle-summary.js",
  "/equipment-loot.js",
  "/expedition-rules.js",
  "/run-relics.js",
  "/deployment-physics.js",
  "/native-content.js",
  "/native-batch.js",
  "/core-species.js",
  "/native-batch-two.js",
  "/pixel-legacy.js",
  "/native-size.js",
  "/evolution-skills.js",
  "/creature-equipment.js",
  "/equipment-catalog.js",
  "/item-effects.js",
  "/ai-relics.js",
  "/status-ailments.js",
  "/loadout-interactions.js",
  "/grand-designs.js",
  "/grand-pixels.js",
  "/native-cloth.js",
  "/combat-text.js",
  "/combat-expansion.js",
  "/combat-feedback.js",
  "/live-roster.js",
  "/starter-equipment.js",
  "/relic-design.js",

  "/native-forms.js",
  "/leg-volume.js",
  "/leg-anatomy.js",
  "/creature-leg-volume.js",
  "/creature-attacks.js",
  "/native-faces.js",
  "/native-poses.js",
  "/native-export.js",
  "/native-combat.js",
  "/native-art.js",
  "/native-tactics.js",
  "/practice.js",
  "/art.js",
  "/skills.js",
  "/roster.js",
  "/animation.js",
  "/tactics.js",
  "/sound.js",
  "/arena.js",
  "/Starfall-Menagerie.html",
  "/prototype.html",
  "/prototype.css",
  "/prototype.js",
  "/prototype-engine.js",
  "/prototype-rig.js",
  "/prototype-motion.js",
  "/prototype-dynamics.js",
  "/prototype-pixel-art.js",
  "/melee-weapon-art.js",
  "/prototype-faces.js",
  "/pixel-face-tools.js",
  "/authored-pixel-art.js",
  "/authored-pixel-maps.js",
  "/authored-sprite-data.js",
  "/authored-body-data.js",
  "/authored-family-data.js",
  "/authored-sprite-stage1-data.js",
  "/authored-sprite-stage2-data.js",
  "/authored-body-stage1-data.js",
  "/authored-body-stage2-data.js",
  "/authored-family-stage1-data.js",
  "/authored-family-stage2-data.js",
  "/authored-legacy-data.js",
  "/authored-legacy-stage1-data.js",
  "/authored-legacy-stage2-data.js",
  "/authored-sprite-renderer.js",
  "/prototype-export.js",
  "/prototype-sprites.js",
  "/prototype-renderer.js",
  "/Starfall-Training-Glade.html",
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
    console.log(`Fang & Feather listening on ${port}`),
  );
