import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mime = { ".png": "image/png", ".woff2": "font/woff2" };
function asset(file) {
  return (
    "data:" +
    mime[path.extname(file)] +
    ";base64," +
    fs.readFileSync(path.join(root, file)).toString("base64")
  );
}
const atlasNames = [
  "creatures",
  "expansion-a",
  "expansion-b",
  "evolved-creatures",
  "evolved-expansion-a",
  "evolved-expansion-b",
  "arena",
];
const assets = Object.fromEntries(
  atlasNames.map((name) => [name + ".png", asset("public/" + name + ".png")]),
);
const css = fs
  .readFileSync(path.join(root, "styles.css"), "utf8")
  .replace(
    /url\("(\/public\/[^"\)]+)"\)/g,
    (_, file) => 'url("' + asset(file.slice(1)) + '")',
  );
const chunks = [
  "(() => { const modules = {}; const embeddedAssets = " +
    JSON.stringify(assets) +
    ";",
];
for (const name of [
  "tactics",
  "arena",
  "roster",
  "skills",
  "game",
  "animation",
  "sound",
  "art",
  "app",
]) {
  let code = fs.readFileSync(path.join(root, name + ".js"), "utf8");
  const exports = [
    ...code.matchAll(/^export\s+(?:const|let|function|class)\s+(\w+)/gm),
  ].map((m) => m[1]);
  code = code.replace(
    /^import\s+\{([^}]+)\}\s+from\s+"\.\/(\w+)\.js";/gm,
    (_, ids, source) => "const {" + ids + "} = modules." + source + ";",
  );
  code = code.replace(/^export\s+/gm, "");
  code = code.replace(
    "sheet.src = `/public/${name}.png`;",
    'sheet.src = embeddedAssets[name + ".png"];',
  );
  code = code.replace(
    'arenaArt.src = "/public/arena.png";',
    'arenaArt.src = embeddedAssets["arena.png"];',
  );
  chunks.push(
    "modules." +
      name +
      " = (() => {\n" +
      code +
      "\nreturn {" +
      exports.join(",") +
      "};\n})();",
  );
}
chunks.push("})();");
const js = chunks.join("\n");
new vm.Script(js);
if (js.includes("sheet.src = `/public/") || /<\/script/i.test(js))
  throw new Error("Unresolved asset or unsafe script embedding");
const html = fs
  .readFileSync(path.join(root, "index.html"), "utf8")
  .replace(
    '<link rel="stylesheet" href="styles.css" />',
    "<style>" + css + "</style>",
  )
  .replace(
    '<script type="module" src="app.js"></script>',
    "<script>" + js + "</script>",
  );
fs.writeFileSync(path.join(root, "Starfall-Menagerie.html"), html);
console.log(
  "Built standalone game: " +
    (Buffer.byteLength(html) / 1024 / 1024).toFixed(1) +
    " MiB, all artwork and fonts embedded.",
);
