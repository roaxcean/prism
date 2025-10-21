import fs from "node:fs/promises";
import sharp from "sharp";
import { Delaunay } from "d3-delaunay";
import type { PathLike } from "fs";
import { consola } from "consola";

// magic numbers
export const index = (x: number, y: number, width: number) => (y * width + x) * 4;

const neighborOffsets = [
    [-1, -1], [0, -1], [1, -1],
    [1, 0], [1, 1], [0, 1],
    [-1, 1], [-1, 0],
];


export async function fix(filePath: PathLike | string | undefined): Promise<void> {
    if (!filePath) {
        consola.warn("No file path provided — skipping.");
        return;
    }

    const resolvedPath = filePath.toString();
    consola.info(`Processing: ${resolvedPath}`);

    try {
        const stat = await fs.stat(resolvedPath);
        if (!stat.isFile()) {
            consola.warn(`Skipping non-file: ${resolvedPath}`);
            return;
        }

        const image = sharp(resolvedPath, { failOn: "none" }).ensureAlpha();
        const metadata = await image.metadata();

        if (!metadata.width || !metadata.height) {
            consola.error(`Unable to read image dimensions: ${resolvedPath}`);
            return;
        }

        const width = metadata.width;
        const height = metadata.height;
        consola.debug(`Dimensions: ${width}×${height}`);

        const raw = await image.raw().toBuffer();
        const pixels = new Uint8ClampedArray(raw);

        const voronoiPoints: [number, number][] = [];
        const voronoiColors: [number, number, number][] = [];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = index(x, y, width);
                if (pixels[idx + 3] === 0) continue; // transparent lol

                for (const [dx, dy] of neighborOffsets) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

                    const nIdx = index(nx, ny, width);
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

        if (voronoiPoints.length === 0) {
            consola.info(`No transparency edges detected — skipping ${resolvedPath}`);
            return;
        }

        consola.debug(`Collected ${voronoiPoints.length} Voronoi points`);
        const delaunay = Delaunay.from(voronoiPoints);
        consola.debug("Delaunay triangulation complete");

        let replaced = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = index(x, y, width);
                if (pixels[idx + 3] !== 0) continue;

                const nearest = delaunay.find(x, y);
                if (nearest == null || !voronoiColors[nearest]) continue;

                const [r, g, b] = voronoiColors[nearest];
                pixels[idx] = r;
                pixels[idx + 1] = g;
                pixels[idx + 2] = b;

                replaced++;
            }
        }

        consola.info(`Replaced ${replaced.toLocaleString()} transparent pixels.`);

        const tmpPath = `${resolvedPath}.tmp`;
        const outputBuffer = await sharp(pixels, {
            raw: { width, height, channels: 4 },
        }).png().toBuffer();

        await fs.writeFile(tmpPath, outputBuffer);
        await fs.rename(tmpPath, resolvedPath);
        consola.success(`Fixed and saved: ${resolvedPath}`);

    } catch (err: any) {
        consola.error(`Error processing ${filePath}: ${err.message}`);
    }
}