"use strict";

/*
*     ____  ____  _ _____ __  ___
*    / __ \/ __ \(_) ___//  |/  /
*   / /_/ / /_/ / /\__ \/ /|_/ /
*  / ____/ _, _/ /___/ / /  / /
* /_/   /_/ |_/_//____/_/  /_/
*
* Probably Repairs Inconsistent Semi-transparency
*/

const fs = require("fs/promises");
const sharp = require("sharp");
const { Delaunay } = require("d3-delaunay");

const neighborOffsets = [
    [-1, -1], [0, -1], [1, -1],
    [1, 0], [1, 1], [0, 1],
    [-1, 1], [-1, 0],
];

const args = process.argv.slice(2);
let dbgMode = false;

for (let i = args.length - 1; i >= 0; i--) {
    if (args[i] === "-d") {
        dbgMode = true;
        args.splice(i, 1);
    }
}

const log = (msg, level = "info") => {
    const prefix = {
        info: "ℹ️",
        success: "✅",
        warn: "⚠️",
        error: "❌",
        debug: "🐛"
    }[level] || "";
    if (level !== "debug" || dbgMode) {
        console.log(`| ${prefix} —— ${msg}`);
    }
};

if (args.length < 1) {
    console.log("Usage:");
    console.log(`  prism [-d] "image1.png" ["image2.png" ...]`);
    return;
}

// TODO: fix the part where it just makes the bg white... for some reason
const fixImage = async (filePath) => {
    log(`Processing ${filePath}`, "info");

    const image = sharp(filePath);
    const { width, height } = await image.metadata();

    log(`Image dimensions: ${width}x${height}`, "debug");

    const raw = await image.ensureAlpha().raw().toBuffer();
    const pixels = new Uint8ClampedArray(raw);

    const voronoiPoints = [];
    const voronoiColors = [];

    const getIndex = (x, y) => (y * width + x) * 4;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = getIndex(x, y);
            const a = pixels[idx + 3];
            if (a === 0) continue;

            for (let [dx, dy] of neighborOffsets) {
                const nx = x + dx, ny = y + dy;
                const nIdx = getIndex(nx, ny);
                const na = pixels[nIdx + 3];
                if (na === 0) {
                    voronoiPoints.push([x, y]);
                    voronoiColors.push([
                        pixels[idx],
                        pixels[idx + 1],
                        pixels[idx + 2]
                    ]);
                    break;
                }
            }
        }
    }

    log(`Collected ${voronoiPoints.length} Voronoi seed points.`, "debug");

    if (voronoiPoints.length === 0) {
        log(`No transparent edge pixels found in ${filePath}`, "warn");
        return;
    }

    const delaunay = Delaunay.from(voronoiPoints);
    log(`Delaunay triangulation generated.`, "debug");

    let replacedPixels = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = getIndex(x, y);
            if (pixels[idx + 3] === 0) {
                const i = delaunay.find(x, y);
                const [r, g, b] = voronoiColors[i];

                pixels[idx] = r;
                pixels[idx + 1] = g;
                pixels[idx + 2] = b;
                pixels[idx + 3] = dbgMode ? 255 : 0;

                replacedPixels++;
            }
        }
    }

    log(`Replaced ${replacedPixels} fully transparent pixels.`, "debug");

    const outputBuffer = await sharp(pixels, {
        raw: { width, height, channels: 4 },
    }).png().toBuffer();

    await fs.writeFile(filePath, outputBuffer);
    log(`Fixed: ${filePath}`, "success");
};

(async () => {
    log(`Debug mode ${dbgMode ? "enabled" : "disabled"}`, "info");

    await Promise.all(args.map(fixImage));

    log("Processing complete.", "info");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    log("Done. Press any key to exit.", "info");
    process.stdin.once("data", () => process.exit(0));
})();
