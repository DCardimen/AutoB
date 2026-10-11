import { BY_ID, ELEMENTS, evolutionStage } from "./game.js";
import {
  creaturePose,
  spriteBone,
  dashPosition,
  visualUnit,
} from "./animation.js";
const TAU = Math.PI * 2;
const atlases = Object.fromEntries(
  [
    "creatures",
    "expansion-a",
    "expansion-b",
    "evolved-creatures",
    "evolved-expansion-a",
    "evolved-expansion-b",
  ].map((name) => {
    const sheet = new Image();
    sheet.src = `/public/${name}.png`;
    sheet.addEventListener("load", artLoaded);
    return [name, sheet];
  }),
);
const arenaArt = new Image();
arenaArt.src = "/public/arena.png";
function artLoaded() {
  iconCache.clear();
  window.dispatchEvent(new Event("art-ready"));
}
arenaArt.addEventListener("load", artLoaded);

function ellipse(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, TAU);
  c.fill();
}
function poly(c, pts, color, stroke) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = color;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1.4;
    c.stroke();
  }
}
function line(c, pts, color, width = 2) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
}
const PALETTE = {
  ember: ["#df7642", "#ffcb79", "#682f2b", "#fff2c1"],
  grove: ["#809c62", "#d2dda0", "#344b40", "#fff4d1"],
  tide: ["#6da3b2", "#b5e8ec", "#2b4963", "#edfaff"],
  storm: ["#a59ac6", "#e1d7fb", "#474566", "#fff3ca"],
  void: ["#7d659e", "#c9aae9", "#292b48", "#e6ddff"],
};
export function drawCreature(
  c,
  id,
  x,
  y,
  size = 38,
  face = 1,
  time = 0,
  dead = false,
  unit = {},
) {
  const s = BY_ID[id],
    p = PALETTE[s.element];
  const stage = evolutionStage(unit);
  const evolvedSheet = atlases[`evolved-${s.artSheet}`];
  const spriteSheet =
    stage && evolvedSheet?.naturalWidth ? evolvedSheet : atlases[s.artSheet];
  if (spriteSheet.complete && spriteSheet.naturalWidth) {
    const i = s.artIndex,
      sw = spriteSheet.width / 5,
      sh = spriteSheet.height / 4,
      dim = size * 2.5 * (stage ? 1.12 + (stage === 2 ? 0.06 : 0) : 1),
      pose = creaturePose({ ...unit, id, hp: dead ? 0 : 1 }, time, s.shape);
    c.save();
    c.translate(x + pose.x * face, y + pose.y);
    c.scale(face, 1);
    c.rotate(pose.rotation);
    c.scale(pose.scaleX, pose.scaleY);
    c.globalAlpha = pose.alpha;
    if (stage && !dead) {
      c.shadowColor = unit.evolutionPath === "warden" ? "#8ef4d0" : p[1];
      c.shadowBlur = stage === 2 ? 15 : 7;
      c.globalAlpha = pose.alpha * 0.18;
      c.drawImage(
        spriteSheet,
        (i % 5) * sw,
        Math.floor(i / 5) * sh,
        sw,
        sh,
        -dim / 2,
        -dim * 0.79,
        dim,
        dim,
      );
      c.shadowBlur = 0;
      c.globalAlpha = pose.alpha;
    }
    // Connected strip bones animate the head, torso, wings, tail, and feet.
    const bones = unit.staticArtwork ? 1 : dead ? 8 : 20;
    for (let bone = 0; bone < bones; bone++) {
      const f = bone / bones,
        part = spriteBone(pose, f, dim);
      c.drawImage(
        spriteSheet,
        (i % 5) * sw,
        Math.floor(i / 5) * sh + f * sh,
        sw,
        sh / bones,
        -dim / 2 + part.x,
        -dim * 0.79 + f * dim + part.y,
        dim,
        dim / bones + 0.5,
      );
    }
    c.shadowBlur = 0;
    if (!dead && (pose.glow || stage === 2)) {
      c.globalAlpha = 0.3 + pose.glow * 0.45;
      c.strokeStyle = p[1];
      c.lineWidth = 1.3;
      c.beginPath();
      c.ellipse(
        0,
        -dim * 0.28,
        dim * 0.44,
        dim * 0.19,
        Math.sin(time) * 0.35,
        0,
        TAU,
      );
      c.stroke();
    }
    c.restore();
    return;
  }
  c.save();
  c.translate(x, y);
  c.scale((size / 45) * face, size / 45);
  if (dead) {
    c.globalAlpha = 0.22;
    c.rotate(-0.5);
  }
  const bob = Math.sin(time * 3 + id.length) * 1.5;
  c.translate(0, bob);
  c.shadowColor = p[1] + "50";
  c.shadowBlur = 6;
  const body = (x, y, rx, ry) => {
    const g = c.createLinearGradient(x - rx, y - ry, x + rx, y + ry);
    g.addColorStop(0, p[1]);
    g.addColorStop(0.4, p[0]);
    g.addColorStop(1, p[2]);
    ellipse(c, x, y, rx, ry, g);
    c.strokeStyle = p[2];
    c.lineWidth = 1.2;
    c.stroke();
  };
  const eye = (x, y) => {
    ellipse(c, x, y, 3.3, 3.8, p[3]);
    ellipse(c, x + 1, y, 1.5, 2.2, p[2]);
  };
  const flame = (x, y, k = 1) => {
    poly(
      c,
      [
        [x - 7 * k, y],
        [x - 10 * k, y - 12 * k],
        [x - 3 * k, y - 8 * k],
        [x + 2 * k, y - 28 * k],
        [x + 8 * k, y - 12 * k],
        [x + 6 * k, y],
      ],
      p[0],
    );
    poly(
      c,
      [
        [x - 3 * k, y],
        [x - 4 * k, y - 10 * k],
        [x + 2 * k, y - 20 * k],
        [x + 3 * k, y],
      ],
      p[1],
    );
  };
  const leg = (x, y) => {
    body(x, y, 5, 12);
    poly(
      c,
      [
        [x - 6, y + 8],
        [x + 5, y + 8],
        [x + 7, y + 13],
        [x - 8, y + 13],
      ],
      p[2],
    );
    line(
      c,
      [
        [x + 1, y + 11],
        [x + 5, y + 11],
      ],
      p[1],
      1.5,
    );
  };
  switch (s.shape) {
    case "fox":
    case "cat":
      poly(
        c,
        [
          [-20, 0],
          [-42, -17],
          [-39, -33],
          [-28, -18],
          [-8, -9],
        ],
        p[0],
        p[2],
      );
      poly(
        c,
        [
          [-40, -29],
          [-37, -14],
          [-31, -10],
          [-33, -24],
        ],
        p[1],
      );
      if (s.element === "ember") flame(-34, -16, 0.7);
      leg(-11, 11);
      leg(13, 11);
      body(-2, -1, 23, 15);
      body(18, -15, 16, 15);
      poly(
        c,
        [
          [5, -23],
          [7, -42],
          [20, -25],
        ],
        p[0],
        p[2],
      );
      poly(
        c,
        [
          [21, -25],
          [35, -40],
          [32, -16],
        ],
        p[0],
        p[2],
      );
      poly(
        c,
        [
          [9, -28],
          [10, -36],
          [15, -27],
        ],
        p[1],
      );
      poly(
        c,
        [
          [25, -25],
          [31, -34],
          [29, -22],
        ],
        p[1],
      );
      body(28, -9, 10, 6);
      eye(24, -19);
      ellipse(c, 36, -11, 2.5, 2, p[2]);
      poly(
        c,
        [
          [9, -4],
          [14, 8],
          [23, -6],
        ],
        p[1],
      );
      if (s.element === "void") {
        line(
          c,
          [
            [-10, -7],
            [1, -1],
            [9, -8],
          ],
          p[1],
          2,
        );
        ellipse(c, 1, -8, 3, 3, p[3]);
      }
      break;
    case "golem":
      leg(-15, 12);
      leg(15, 12);
      body(0, -4, 25, 25);
      body(-28, -4, 12, 17);
      body(27, -5, 12, 18);
      poly(
        c,
        [
          [-27, -14],
          [-37, -20],
          [-39, 6],
          [-26, 12],
        ],
        p[2],
      );
      poly(
        c,
        [
          [26, -16],
          [37, -22],
          [42, 5],
          [27, 13],
        ],
        p[0],
        p[2],
      );
      poly(
        c,
        [
          [-20, -15],
          [-12, -31],
          [14, -29],
          [23, -13],
          [10, 3],
          [-11, 2],
        ],
        p[0],
        p[2],
      );
      body(0, -28, 15, 12);
      eye(-5, -29);
      eye(6, -29);
      poly(
        c,
        [
          [0, -17],
          [7, -9],
          [0, 0],
          [-7, -9],
        ],
        p[1],
      );
      for (let i = 0; i < 5; i++) {
        const a = (i * TAU) / 5;
        poly(
          c,
          [
            [Math.cos(a) * 19, -3 + Math.sin(a) * 20],
            [Math.cos(a) * 30, -3 + Math.sin(a) * 30],
            [Math.cos(a + 0.25) * 23, -3 + Math.sin(a + 0.25) * 23],
          ],
          p[1],
        );
      }
      if (s.element === "grove") {
        line(
          c,
          [
            [-12, -37],
            [-18, -49],
            [-7, -44],
          ],
          p[0],
          4,
        );
        ellipse(c, -17, -48, 8, 4, p[1]);
      }
      break;
    case "rhino":
    case "turtle":
      leg(-17, 13);
      leg(16, 13);
      body(-7, -2, 29, 21);
      if (s.shape === "turtle") {
        poly(
          c,
          [
            [-32, -13],
            [-17, -28],
            [6, -29],
            [22, -13],
            [12, 9],
            [-22, 9],
          ],
          p[2],
          p[0],
        );
        line(
          c,
          [
            [-17, -25],
            [-10, -5],
            [6, -27],
          ],
          p[1],
        );
        line(
          c,
          [
            [-10, -5],
            [-24, 4],
          ],
          p[0],
        );
        line(
          c,
          [
            [-10, -5],
            [12, 6],
          ],
          p[0],
        );
      } else
        poly(
          c,
          [
            [-25, -18],
            [-16, -36],
            [-8, -16],
            [2, -34],
            [10, -13],
          ],
          p[2],
          p[1],
        );
      body(25, -5, 17, 15);
      poly(
        c,
        [
          [29, -12],
          [40, -33],
          [38, -7],
        ],
        p[1],
        p[2],
      );
      eye(27, -9);
      ellipse(c, 40, -1, 3, 2, p[2]);
      if (s.element === "ember") flame(-15, -23, 0.6);
      break;
    case "bird":
      const flap = Math.sin(time * 7) * 6;
      poly(
        c,
        [
          [-6, -7],
          [-36, -34 - flap],
          [-44, -13],
          [-22, -15],
          [-35, 0],
          [-8, 9],
        ],
        p[0],
        p[2],
      );
      poly(
        c,
        [
          [6, -7],
          [36, -34 + flap],
          [44, -13],
          [22, -15],
          [35, 0],
          [8, 9],
        ],
        p[0],
        p[2],
      );
      line(
        c,
        [
          [-10, -9],
          [-33, -24 - flap],
        ],
        p[1],
        3,
      );
      line(
        c,
        [
          [10, -9],
          [33, -24 + flap],
        ],
        p[1],
        3,
      );
      poly(
        c,
        [
          [-7, 12],
          [-17, 32],
          [0, 24],
          [9, 34],
          [9, 8],
        ],
        p[2],
        p[1],
      );
      body(0, -3, 14, 23);
      body(6, -25, 12, 10);
      poly(
        c,
        [
          [16, -24],
          [30, -21],
          [15, -16],
        ],
        p[1],
      );
      poly(
        c,
        [
          [-3, -31],
          [0, -46],
          [7, -31],
        ],
        p[1],
      );
      eye(10, -26);
      line(
        c,
        [
          [-4, 13],
          [-3, 25],
          [4, 23],
        ],
        p[1],
        2,
      );
      break;
    case "fish":
      poly(
        c,
        [
          [-20, 0],
          [-44, -19],
          [-36, 4],
          [-42, 25],
          [-19, 12],
        ],
        p[0],
        p[2],
      );
      body(-1, -1, 27, 20);
      poly(
        c,
        [
          [-18, -14],
          [-14, -34],
          [3, -22],
          [11, -34],
          [16, -11],
        ],
        p[1],
        p[2],
      );
      poly(
        c,
        [
          [-10, 11],
          [-9, 28],
          [13, 15],
        ],
        p[0],
        p[1],
      );
      body(21, -5, 15, 16);
      eye(25, -9);
      ellipse(c, 33, 1, 4, 2, p[2]);
      line(
        c,
        [
          [-9, -4],
          [1, 7],
          [8, -6],
        ],
        p[1],
        2,
      );
      break;
    case "sprite":
      line(
        c,
        [
          [0, 10],
          [-7, 27],
        ],
        p[2],
        5,
      );
      line(
        c,
        [
          [2, 11],
          [13, 26],
        ],
        p[2],
        5,
      );
      body(0, 0, 13, 17);
      poly(
        c,
        [
          [-8, -4],
          [-30, -18],
          [-36, -7],
          [-22, 6],
          [-8, 5],
        ],
        p[0],
        p[1],
      );
      poly(
        c,
        [
          [8, -4],
          [30, -18],
          [36, -7],
          [22, 6],
          [8, 5],
        ],
        p[0],
        p[1],
      );
      for (let i = 0; i < 7; i++) {
        const a = (i * TAU) / 7;
        ellipse(
          c,
          Math.cos(a) * 19,
          -23 + Math.sin(a) * 16,
          8,
          13,
          i % 2 ? p[0] : p[1],
        );
      }
      body(0, -23, 14, 14);
      eye(-5, -24);
      eye(5, -24);
      line(
        c,
        [
          [-3, -16],
          [0, -14],
          [4, -16],
        ],
        p[2],
        1.5,
      );
      ellipse(c, 0, -40, 4, 5, "#f5cf91");
      break;
    case "stag":
      leg(-13, 12);
      leg(15, 12);
      body(-5, -1, 24, 14);
      body(16, -16, 10, 21);
      body(21, -29, 13, 11);
      body(33, -24, 8, 6);
      eye(24, -31);
      line(
        c,
        [
          [14, -37],
          [9, -51],
          [1, -60],
          [-4, -55],
        ],
        p[1],
        4,
      );
      line(
        c,
        [
          [9, -51],
          [14, -60],
          [12, -68],
        ],
        p[1],
        3,
      );
      line(
        c,
        [
          [23, -37],
          [27, -53],
          [37, -65],
          [42, -59],
        ],
        p[1],
        4,
      );
      line(
        c,
        [
          [27, -53],
          [23, -63],
        ],
        p[1],
        3,
      );
      poly(
        c,
        [
          [-25, -5],
          [-35, -17],
          [-27, -15],
        ],
        p[0],
      );
      for (let i = 0; i < 3; i++) ellipse(c, -16 + i * 11, -9, 3, 2, p[1]);
      break;
    case "rabbit":
      body(-10, 8, 13, 15);
      body(2, -3, 20, 20);
      body(18, -19, 14, 13);
      body(12, -41, 5, 20);
      body(24, -40, 5, 19);
      line(
        c,
        [
          [12, -54],
          [12, -36],
        ],
        p[1],
        3,
      );
      line(
        c,
        [
          [24, -53],
          [24, -33],
        ],
        p[1],
        3,
      );
      eye(23, -23);
      body(20, 18, 14, 5);
      body(-21, 19, 12, 5);
      ellipse(c, -24, -2, 8, 8, p[1]);
      poly(
        c,
        [
          [0, -13],
          [6, -1],
          [-1, -1],
          [4, 11],
          [-8, -6],
          [-2, -6],
        ],
        p[1],
      );
      break;
    case "dragon":
      line(
        c,
        [
          [-12, 7],
          [-38, 13],
          [-45, -2],
        ],
        p[0],
        10,
      );
      poly(
        c,
        [
          [-9, -9],
          [-24, -45],
          [-36, -28],
          [-42, -44],
          [-43, -7],
          [-18, 6],
        ],
        p[2],
        p[0],
      );
      poly(
        c,
        [
          [5, -8],
          [23, -43],
          [34, -27],
          [41, -39],
          [39, -6],
          [13, 7],
        ],
        p[2],
        p[0],
      );
      line(
        c,
        [
          [-9, -9],
          [-24, -45],
        ],
        p[1],
        2,
      );
      line(
        c,
        [
          [5, -8],
          [23, -43],
        ],
        p[1],
        2,
      );
      leg(-8, 13);
      leg(14, 13);
      body(0, -1, 20, 20);
      body(18, -24, 14, 18);
      body(30, -21, 13, 8);
      poly(
        c,
        [
          [12, -35],
          [10, -48],
          [23, -36],
        ],
        p[1],
      );
      poly(
        c,
        [
          [25, -34],
          [30, -47],
          [32, -29],
        ],
        p[1],
      );
      eye(25, -27);
      poly(
        c,
        [
          [15, -17],
          [5, -6],
          [15, 4],
        ],
        p[1],
      );
      for (let i = 0; i < 3; i++)
        poly(
          c,
          [
            [-15 - i * 7, 5],
            [-18 - i * 7, -6],
            [-22 - i * 7, 8],
          ],
          p[1],
        );
      if (s.element === "ember") flame(-38, 4, 0.6);
      break;
    case "mushroom":
      body(0, 7, 15, 21);
      body(-20, 6, 8, 10);
      body(20, 6, 8, 10);
      body(-8, 26, 8, 4);
      body(9, 26, 8, 4);
      body(0, -14, 32, 14);
      poly(
        c,
        [
          [-32, -11],
          [-26, -27],
          [-11, -39],
          [9, -37],
          [26, -25],
          [33, -11],
        ],
        p[0],
        p[2],
      );
      ellipse(c, -11, -25, 6, 4, p[1]);
      ellipse(c, 10, -29, 5, 4, p[1]);
      ellipse(c, 22, -16, 4, 3, p[1]);
      ellipse(c, 0, -14, 30, 4, p[2]);
      eye(-5, 2);
      eye(5, 2);
      break;
  }
  c.shadowBlur = 0;
  c.restore();
}
const iconCache = new Map();
export function creatureImage(input) {
  const unit = typeof input === "string" ? { id: input } : input;
  const id = unit.id,
    key = `${id}:${evolutionStage(unit)}:${unit.evolutionPath || ""}`;
  if (iconCache.has(key)) return iconCache.get(key);
  const c = document.createElement("canvas");
  c.width = 200;
  c.height = 200;
  const x = c.getContext("2d");
  const color = ELEMENTS[BY_ID[id].element].color;
  const g = x.createRadialGradient(100, 100, 5, 100, 100, 100);
  g.addColorStop(0, color + "32");
  g.addColorStop(1, color + "00");
  x.fillStyle = g;
  x.fillRect(0, 0, 200, 200);
  ellipse(x, 100, 158, 45, 9, "#00000045");
  drawCreature(x, id, 100, 130, 56, 1, 0, false, {
    ...unit,
    staticArtwork: true,
  });
  const data = c.toDataURL();
  iconCache.set(key, data);
  return data;
}
export function drawArena(c, w, h, planet, time = 0) {
  c.save();
  c.scale(w / 1000, h / 560);
  if (arenaArt.complete && arenaArt.naturalWidth) {
    c.drawImage(arenaArt, 0, 0, 1000, 560);
    if (planet === 1) {
      c.fillStyle = "#a2483526";
      c.fillRect(0, 0, 1000, 560);
    }
    if (planet === 2) {
      c.fillStyle = "#47255755";
      c.fillRect(0, 0, 1000, 560);
    }
    const v = c.createRadialGradient(500, 320, 160, 500, 320, 640);
    v.addColorStop(0, "#111b1300");
    v.addColorStop(1, "#08130b7a");
    c.fillStyle = v;
    c.fillRect(0, 0, 1000, 560);
    for (let i = 0; i < 19; i++)
      ellipse(
        c,
        ((i * 73.3) % 1000) + Math.sin(time * 0.2 + i) * 12,
        80 + ((i * 39) % 450) + Math.sin(time * 0.3 + i) * 12,
        1.4,
        1.4,
        "#e7d89588",
      );
    c.restore();
    return;
  }
  const pal =
    planet === 1
      ? ["#261c21", "#73503c", "#ca9861"]
      : planet === 2
        ? ["#1b1e30", "#5a536e", "#a79bac"]
        : ["#1d2e2a", "#637366", "#c5b58c"];
  let g = c.createLinearGradient(0, 0, 0, 560);
  g.addColorStop(0, pal[0]);
  g.addColorStop(0.45, pal[1]);
  g.addColorStop(1, "#232b27");
  c.fillStyle = g;
  c.fillRect(0, 0, 1000, 560);
  // Distant stars and mountains beyond the abandoned colosseum.
  for (let i = 0; i < 45; i++) {
    const x = (i * 173.3) % 1000,
      y = (i * 31.7) % 160;
    c.fillStyle = `rgba(216,228,210,${0.15 + 0.2 * Math.sin(i + time * 0.15) ** 2})`;
    c.fillRect(x, y, 1.5, 1.5);
  }
  poly(
    c,
    [
      [0, 157],
      [90, 56],
      [172, 118],
      [271, 53],
      [394, 139],
      [521, 32],
      [600, 133],
      [727, 63],
      [850, 125],
      [944, 42],
      [1000, 124],
      [1000, 250],
      [0, 250],
    ],
    "#192623",
  );
  for (let i = 0; i < 17; i++) {
    const x = i * 65 - 25,
      top = 105 + Math.abs(i - 8) * 3;
    c.fillStyle = "#34433a";
    c.fillRect(x, top, 52, 145);
    c.fillStyle = "#1a2a27";
    c.beginPath();
    c.roundRect(x + 9, top + 18, 33, 90, [16, 16, 0, 0]);
    c.fill();
    c.fillStyle = "#69715a";
    c.fillRect(x - 4, top - 5, 60, 7);
    c.fillStyle = "#475346";
    c.fillRect(x + 6, top + 30, 3, 76);
  }
  c.fillStyle = "#23382b";
  c.fillRect(0, 228, 1000, 25);
  c.fillStyle = "#798169";
  c.fillRect(0, 229, 1000, 3);
  c.fillStyle = "#182c24";
  c.fillRect(0, 244, 1000, 8);
  // Soft, luminous arena floor, with hand-cut tiles.
  g = c.createRadialGradient(480, 350, 45, 500, 340, 560);
  g.addColorStop(0, pal[2]);
  g.addColorStop(0.65, pal[1]);
  g.addColorStop(1, pal[0]);
  ellipse(c, 500, 364, 560, 237, g);
  c.save();
  c.beginPath();
  c.ellipse(500, 364, 540, 225, 0, 0, TAU);
  c.clip();
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 14; col++) {
      const x = col * 90 + (row % 2 ? 45 : 0) - 80,
        y = 165 + row * 46;
      c.strokeStyle = "#28322a45";
      c.lineWidth = 1;
      poly(
        c,
        [
          [x, y + 12],
          [x + 44, y],
          [x + 86, y + 12],
          [x + 86, y + 35],
          [x + 43, y + 46],
          [x, y + 35],
        ],
        "rgba(230,220,180," +
          (Math.sin(row * 10 + col) * 0.5 + 0.5) * 0.05 +
          ")",
        "#333a303b",
      );
    }
  }
  c.strokeStyle = "#efe0af32";
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(500, 330, 310, 150, 0, 0, TAU);
  c.stroke();
  c.beginPath();
  c.ellipse(500, 330, 270, 133, 0, 0, TAU);
  c.stroke();
  c.beginPath();
  c.ellipse(500, 330, 110, 62, 0, 0, TAU);
  c.stroke();
  line(
    c,
    [
      [500, 268],
      [535, 330],
      [500, 392],
      [465, 330],
      [500, 268],
    ],
    "#eee0b02e",
    2,
  );
  for (let i = 0; i < 70; i++) {
    const x = (i * 173.31) % 1000,
      y = 240 + ((i * 54.7) % 290);
    c.fillStyle = "#111d1a" + (i % 2 ? "20" : "10");
    c.fillRect(x, y, 2 + (i % 3), 1);
  }
  c.restore();
  // Foreground rocks, ruins, ferns and small golden fireflies.
  for (const x of [-12, 965]) {
    poly(
      c,
      [
        [x, 220],
        [x + 40, 207],
        [x + 59, 510],
        [x + 38, 560],
        [x - 14, 560],
      ],
      "#283b31",
      "#465444",
    );
    c.fillStyle = "#78816a";
    c.fillRect(x - 6, 218, 68, 8);
  }
  for (let i = 0; i < 23; i++) {
    const x = i < 12 ? i * 26 - 20 : 1000 - (i - 12) * 28,
      y = 500 + Math.sin(i * 5) * 28;
    line(
      c,
      [
        [x, y + 30],
        [x + 4, y - 14],
      ],
      "#293e2c",
      3,
    );
    for (let j = 0; j < 5; j++) {
      const yy = y + 12 - j * 6;
      line(
        c,
        [
          [x + 2, yy],
          [x - 12 - j, yy - 10],
        ],
        "#4d6544",
        2,
      );
      line(
        c,
        [
          [x + 2, yy],
          [x + 15 + j, yy - 11],
        ],
        "#536a48",
        2,
      );
    }
  }
  for (let i = 0; i < 18; i++) {
    const x = ((i * 83) % 1000) + Math.sin(time * 0.2 + i) * 12,
      y = 100 + ((i * 37) % 400) + Math.sin(time * 0.3 + i) * 18;
    ellipse(c, x, y, 1.5, 1.5, "#e0c98666");
  }
  const vignette = c.createRadialGradient(500, 310, 130, 500, 310, 620);
  vignette.addColorStop(0, "#0a121400");
  vignette.addColorStop(1, "#0a141bbd");
  c.fillStyle = vignette;
  c.fillRect(0, 0, 1000, 560);
  c.restore();
}
export function renderBattle(
  c,
  w,
  h,
  battle,
  planet,
  time,
  previewTeam,
  previewFoes,
) {
  drawArena(c, w, h, planet, time);
  c.save();
  c.scale(w / 1000, h / 560);
  if (battle?.shake && !battle.reducedMotion) {
    c.translate(
      Math.sin(battle.time * 83) * battle.shake,
      Math.cos(battle.time * 69) * battle.shake * 0.4,
    );
  }
  const units = battle
    ? battle.units
    : [
        ...previewTeam.map((u, i) => ({
          ...u,
          side: 0,
          x: u.deployment
            ? [155, 225, 305][u.deployment.column]
            : i >= 3
              ? 225
              : BY_ID[u.id].range > 100
                ? 155
                : 305,
          y: u.deployment
            ? [155, 275, 395][u.deployment.row] + (i >= 3 ? 24 : -15)
            : [155, 275, 395][i % 3] + (i >= 3 ? 24 : -15),
          hp: 1,
          maxHp: 1,
        })),
        ...previewFoes.map((u, i) => ({
          ...u,
          side: 1,
          x: (BY_ID[u.id].range > 100 ? 820 : 710) + (i >= 3 ? 28 : -25),
          y: 180 + (i % 3) * 100 + (i >= 3 ? 35 : -25),
          hp: 1,
          maxHp: 1,
        })),
      ];
  if (battle) {
    for (const field of battle.fields || []) {
      c.fillStyle = "#97df9d15";
      c.strokeStyle = "#b5e7b466";
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(field.x, field.y, field.r, field.r * 0.5, 0, 0, TAU);
      c.fill();
      c.stroke();
    }
    for (const hazard of battle.hazards) {
      const danger = hazard.source.side === 1;
      c.strokeStyle = danger ? "#ff826cdd" : "#b2e49aaa";
      c.fillStyle = danger ? "#ff826c22" : "#b2e49a16";
      c.lineWidth = 2;
      c.setLineDash([5, 5]);
      c.beginPath();
      c.ellipse(hazard.x, hazard.y, hazard.r, hazard.r * 0.52, 0, 0, TAU);
      c.fill();
      c.stroke();
      c.setLineDash([]);
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(
        hazard.x,
        hazard.y,
        hazard.r,
        hazard.r * 0.52,
        0,
        -Math.PI / 2,
        -Math.PI / 2 + TAU * (1 - hazard.ttl / hazard.total),
      );
      c.stroke();
      c.fillStyle = danger ? "#ffbead" : "#d7ecc2";
      c.font = 'bold 10px "DM Sans",sans-serif';
      c.textAlign = "center";
      c.fillText(danger ? "DANGER" : "ALLY FIELD", hazard.x, hazard.y + 4);
    }
  }
  for (const raw of units.slice().sort((a, b) => a.y - b.y)) {
    const u =
      battle && !battle.reducedMotion
        ? visualUnit(raw, battle.renderAlpha, battle.finishedVisualTime || 0)
        : raw;
    const s = BY_ID[u.id],
      color = ELEMENTS[s.element].color;
    const size = u.boss ? 55 : 34;
    ellipse(
      c,
      u.x,
      u.y + 22,
      size * 0.75,
      9,
      u.hp > 0 ? "#080d1760" : "#080d1720",
    );
    if (u.hp > 0) {
      c.strokeStyle = u.side === 0 ? "#b1da8d77" : "#e69b8077";
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(u.x, u.y + 20, size * 0.83, 12, 0, 0, TAU);
      c.stroke();
    }
    const position =
      battle && !battle.reducedMotion ? dashPosition(u) : { x: u.x, y: u.y };
    if (u.dashAnim > 0 && u.dashFrom && !battle?.reducedMotion) {
      for (let trail = 0; trail < 3; trail++) {
        const fraction = Math.max(0, 1 - u.dashAnim / 0.38 - trail * 0.1);
        c.globalAlpha = 0.11 * (1 - trail / 3);
        drawCreature(
          c,
          u.id,
          u.dashFrom.x + (u.x - u.dashFrom.x) * fraction,
          u.dashFrom.y + (u.y - u.dashFrom.y) * fraction,
          size,
          u.face,
          battle.time,
          false,
          { ...u, staticArtwork: true, attackAnim: 0, dashAnim: 0 },
        );
      }
      c.globalAlpha = 1;
    }
    drawCreature(
      c,
      u.id,
      position.x,
      position.y,
      size,
      u.face || (u.side === 0 ? 1 : -1),
      battle
        ? battle.time +
            (battle.renderAlpha || 0) * 0.04 +
            (battle.finishedVisualTime || 0)
        : time,
      u.hp <= 0,
      battle?.reducedMotion
        ? {
            ...u,
            staticArtwork: true,
            motion: 0,
            attackAnim: 0,
            castAnim: 0,
            dodgeAnim: 0,
            hitAnim: 0,
            velocityX: 0,
          }
        : u,
    );
    if (u.hp > 0) {
      const barw = u.boss ? 80 : 47,
        bx = u.x - barw / 2,
        by = u.y - (u.boss ? 126 : evolutionStage(u) ? 96 : 81);
      c.fillStyle = "#081319d9";
      c.fillRect(bx - 1, by - 1, barw + 2, 6);
      c.fillStyle = u.side === 0 ? "#c1d998" : "#d99b86";
      c.fillRect(bx, by, (barw * u.hp) / u.maxHp, 4);
      if (u.shield > 0) {
        c.fillStyle = "#89cbd0";
        c.fillRect(bx, by - 3, Math.min(barw, (barw * u.shield) / u.maxHp), 2);
      }
      if (battle) {
        c.fillStyle = color + "99";
        c.fillRect(
          bx,
          by + 7,
          barw * (1 - Math.max(0, u.skillTimer) / u.cd),
          2,
        );
        if (u.burn > 0) ellipse(c, u.x + 24, u.y - 20, 3, 4, "#ff8c56");
        const statuses = [
          ["poison", "P", "#b4d97b"],
          ["root", "R", "#b2d18c"],
          ["slow", "S", "#9ddff0"],
          ["wither", "W", "#d6a0d7"],
          ["exposed", "!", "#f6c284"],
        ].filter(([key]) => u[key] > 0);
        c.font = 'bold 8px "DM Sans",sans-serif';
        c.textAlign = "center";
        statuses.forEach(([key, label, tint], i) => {
          ellipse(c, bx + i * 11, by - 10, 5, 5, "#102019");
          c.fillStyle = tint;
          c.fillText(label, bx + i * 11, by - 7);
        });
        if (battle.capturePlan?.uid === u.uid && !battle.captureSettled) {
          c.strokeStyle = "#f4d995";
          c.lineWidth = 2;
          c.beginPath();
          c.ellipse(u.x, u.y + 20, size, 15, 0, 0, TAU);
          c.stroke();
        }
        if (u.flash > 0) {
          c.globalAlpha = 0.4;
          c.fillStyle = "#fff";
          c.beginPath();
          c.arc(u.x, u.y, 24, 0, TAU);
          c.fill();
          c.globalAlpha = 1;
        }
      } else {
        c.font = '9px "DM Sans",sans-serif';
        c.textAlign = "center";
        c.fillStyle = "#d6ddcaaa";
        c.fillText(s.name, u.x, by - 6);
      }
    }
  }
  if (battle) {
    for (const p of battle.projectiles) {
      c.shadowBlur = 16;
      c.shadowColor = p.color;
      for (let i = 0; i < p.trail.length; i++) {
        const tr = p.trail[i];
        ellipse(
          c,
          tr.x,
          tr.y,
          ((p.skill ? 4 : 2.5) * i) / p.trail.length + 1,
          ((p.skill ? 4 : 2.5) * i) / p.trail.length + 1,
          p.color +
            Math.round((i / p.trail.length) * 150)
              .toString(16)
              .padStart(2, "0"),
        );
      }
      ellipse(c, p.x, p.y, p.skill ? 5 : 3.5, p.skill ? 5 : 3.5, "#fff5df");
    }
    c.shadowBlur = 0;
    for (const e of battle.effects) {
      const a = Math.max(0, e.ttl / e.max),
        t = 1 - a;
      c.globalAlpha = a;
      c.strokeStyle = e.color;
      c.fillStyle = e.color;
      c.lineCap = "round";
      c.shadowColor = e.color;
      c.shadowBlur = 10;
      if (e.type === "text") {
        c.shadowColor = "#142016";
        c.shadowBlur = 4;
        c.font =
          e.text.length > 12
            ? '10px "DM Sans",sans-serif'
            : 'bold 13px "DM Sans",sans-serif';
        c.textAlign = "center";
        c.fillText(e.text, e.x, e.y - t * 35);
      } else if (["beam", "dash", "breath"].includes(e.type)) {
        const dx = e.tx - e.x,
          dy = e.ty - e.y;
        c.lineWidth =
          e.type === "beam"
            ? (e.width || 6) * a
            : e.type === "dash"
              ? 18 * a
              : 24 * a;
        line(
          c,
          [
            [e.x, e.y],
            [e.tx, e.ty],
          ],
          e.color + "88",
          c.lineWidth,
        );
        line(
          c,
          [
            [e.x, e.y],
            [e.tx, e.ty],
          ],
          "#fff4d6aa",
          Math.max(1, c.lineWidth * 0.25),
        );
        if (e.type === "breath") {
          const d = Math.hypot(dx, dy) || 1,
            nx = -dy / d,
            ny = dx / d;
          poly(
            c,
            [
              [e.x, e.y],
              [e.tx + nx * e.r * 0.5, e.ty + ny * e.r * 0.5],
              [e.tx - nx * e.r * 0.5, e.ty - ny * e.r * 0.5],
            ],
            e.color + "40",
          );
        }
      } else if (e.type === "lightning") {
        const pts = [];
        for (let i = 0; i <= 7; i++) {
          const f = i / 7;
          pts.push([
            e.x +
              (e.tx - e.x) * f +
              (i && i < 7 ? Math.sin(i * 92 + e.ttl * 36) * 13 : 0),
            e.y + (e.ty - e.y) * f + (i && i < 7 ? Math.cos(i * 49) * 9 : 0),
          ]);
        }
        line(c, pts, e.color, 4 * a + 1);
        line(c, pts, "#fff1ea", 1.2);
      } else if (e.type === "slash") {
        c.lineWidth = 8 * a;
        c.beginPath();
        c.ellipse(
          e.x,
          e.y,
          e.r * (0.7 + t * 0.5),
          e.r * 0.6,
          (e.face || 1) > 0 ? -0.5 : 0.5,
          0.1 + t * 0.8,
          Math.PI * 1.1 + t * 0.4,
        );
        c.stroke();
        c.lineWidth = 2;
        c.strokeStyle = "#fff1d3";
        c.stroke();
      } else if (e.type === "capture") {
        c.lineWidth = 3;
        const radius = e.r * (0.6 + Math.sin(t * Math.PI) * 0.4);
        c.beginPath();
        c.ellipse(e.x, e.y - 20, radius * 0.55, radius * 0.8, 0, 0, TAU);
        c.stroke();
        for (let i = 0; i < 8; i++) {
          const angle = (i * TAU) / 8 + t * 5;
          ellipse(
            c,
            e.x + Math.cos(angle) * radius * 0.6,
            e.y - 20 + Math.sin(angle) * radius * 0.7,
            3,
            3,
            e.color,
          );
        }
      } else if (e.type === "heal") {
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(
          e.x,
          e.y + 16,
          e.r * (0.7 + t * 0.7),
          e.r * 0.3 * (0.7 + t * 0.7),
          0,
          0,
          TAU,
        );
        c.stroke();
        for (let i = 0; i < 4; i++) {
          const x = e.x + Math.sin(i * 2) * 20,
            y = e.y - t * 45 + i * 9;
          line(
            c,
            [
              [x - 3, y],
              [x + 3, y],
            ],
            e.color,
            1.5,
          );
          line(
            c,
            [
              [x, y - 3],
              [x, y + 3],
            ],
            e.color,
            1.5,
          );
        }
      } else if (e.type === "shield") {
        c.fillStyle = e.color + "19";
        poly(
          c,
          [
            [e.x, e.y - 49],
            [e.x + 32, e.y - 31],
            [e.x + 26, e.y + 7],
            [e.x, e.y + 24],
            [e.x - 26, e.y + 7],
            [e.x - 32, e.y - 31],
          ],
          e.color + "15",
          e.color + "99",
        );
      } else if (e.type === "cast") {
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(
          e.x,
          e.y + 14,
          e.r * (0.5 + t * 0.7),
          e.r * 0.35 * (0.5 + t * 0.7),
          0,
          0,
          TAU,
        );
        c.stroke();
        line(
          c,
          [
            [e.x, e.y + 10],
            [e.x, e.y - 65],
          ],
          e.color + "55",
          5 * a,
        );
      } else if (e.type === "impact") {
        const r = e.r * (0.25 + t);
        c.lineWidth = 3 * a;
        c.beginPath();
        c.arc(e.x, e.y, r, 0, TAU);
        c.stroke();
        line(
          c,
          [
            [e.x - r, e.y],
            [e.x + r, e.y],
          ],
          "#fff2c8",
          1.3,
        );
        line(
          c,
          [
            [e.x, e.y - r],
            [e.x, e.y + r],
          ],
          "#fff2c8",
          1.3,
        );
      } else if (e.type !== "telegraph") {
        const r = (e.r || 40) * (0.15 + t);
        c.lineWidth = (e.type === "nova" ? 7 : 2) * a;
        c.beginPath();
        c.ellipse(e.x, e.y + 12, r, r * 0.48, 0, 0, TAU);
        c.stroke();
        if (e.type === "nova") {
          c.globalAlpha = a * 0.13;
          ellipse(c, e.x, e.y + 12, r, r * 0.48, e.color);
        }
      }
      c.globalAlpha = 1;
      c.shadowBlur = 0;
    }
    for (const p of battle.particles) {
      c.globalAlpha = Math.max(0, p.ttl / p.max);
      c.shadowColor = p.color;
      c.shadowBlur = 5;
      ellipse(c, p.x, p.y, p.size, p.size, p.color);
    }
    c.globalAlpha = 1;
    c.shadowBlur = 0;
  }

  c.restore();
}
