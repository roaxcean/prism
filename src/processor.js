import fs from "node:fs/promises";
import sharp from "sharp";
import { Delaunay } from "d3-delaunay";
import { log } from "./logger.js";
import { neighborOffsets, getIndex } from "./utils.js";

export async function fixImage(filePath) {
    log(`Processing ${filePath}`, "info");

    const image = sharp(filePath);
    const { width, height } = await image.metadata();
    log(`Image dimensions: ${width}x${height}`, "debug");

    const raw = await image.ensureAlpha().raw().toBuffer();
    const pixels = new Uint8ClampedArray(raw);

    const voronoiPoints = [];
    const voronoiColors = [];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = getIndex(x, y, width);
            if (pixels[idx + 3] === 0) continue;

            for (const [dx, dy] of neighborOffsets) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

                const nIdx = getIndex(nx, ny, width);
                if (pixels[nIdx + 3] === 0) {
                    voronoiPoints.push([x, y]);
                    voronoiColors.push([
                        pixels[idx],
                        pixels[idx + 1],
                        pixels[idx + 2],
                    ]);
                    break;
                }
            }
        }
    }

    log(`Collected ${voronoiPoints.length} Voronoi seed points.`, "debug");

    if (voronoiPoints.length === 0) {
        log(`No edge transparency detected. Skipping.`, "warn");
        return;
    }

    const delaunay = Delaunay.from(voronoiPoints);
    log(`Delaunay triangulation complete.`, "debug");

    let replaced = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = getIndex(x, y, width);
            if (pixels[idx + 3] !== 0) continue;

            const nearest = delaunay.find(x, y);
            const [r, g, b] = voronoiColors[nearest];

            pixels[idx] = r;
            pixels[idx + 1] = g;
            pixels[idx + 2] = b;
            // Maintain 0 alpha, or force debug visibility
            pixels[idx + 3] = 0;

            replaced++;
        }
    }

    log(`Replaced ${replaced} transparent pixels.`, "debug");

    const outputBuffer = await sharp(pixels, {
        raw: { width, height, channels: 4 },
    }).png().toBuffer();

    await fs.writeFile(filePath, outputBuffer);
    log(`✔ Fixed: ${filePath}`, "success");
}
