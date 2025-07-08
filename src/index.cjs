"use strict";

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

// Check for debug flag
for (let i = args.length - 1; i >= 0; i--) {
    if (args[i] === "-d") {
        dbgMode = true;
        args.splice(i, 1);
    }
}

if (args.length < 1) {
    console.log("Usage:");
    console.log(`  prism [-d] "image1.png" ["image2.png" ...]`);
    return;
}

const fixImage = async (filePath) => {
    const image = sharp(filePath);
    const { width, height } = await image.metadata();

    const raw = await image.ensureAlpha().raw().toBuffer();
    const pixels = new Uint8ClampedArray(raw);

    const voronoiPoints = [];
    const voronoiColors = [];

    const getIndex = (x, y) => (y * width + x) * 4;

    // Collect edge pixels
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

    if (voronoiPoints.length === 0) {
        console.log(`No transparent edge pixels found in ${filePath}`);
        return;
    }

    const delaunay = Delaunay.from(voronoiPoints);

    // Apply fix to transparent pixels
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
            }
        }
    }

    const outputBuffer = await sharp(pixels, {
        raw: { width, height, channels: 4 },
    }).png().toBuffer();

    await fs.writeFile(filePath, outputBuffer);
    console.log(`✔ Fixed: ${filePath}`);
};

(async () => {
    await Promise.all(args.map(fixImage));
    console.log("Done. Press any key to exit.");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once("data", () => process.exit(0));
})();
