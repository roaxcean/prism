#!/usr/bin/env node
import { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";
import { consola } from "consola";
import { fix } from "./engine.js";
import type { PathLike } from "fs";

const program = new Command();

async function collect(folderPath: PathLike, recursive = false): Promise<string[]> {
    try {
        const absPath = path.resolve(folderPath.toString());
        const stats = await fs.stat(absPath);

        if (!stats.isDirectory()) {
            throw new Error(`Provided path is not a directory: ${absPath}`);
        }

        const entries = await fs.readdir(absPath, { withFileTypes: true });
        const files: string[] = [];

        for (const entry of entries) {
            const entryPath = path.join(absPath, entry.name);

            if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
                files.push(entryPath);
            } else if (recursive && entry.isDirectory()) {
                const nested = await collect(entryPath, true);
                files.push(...nested);
            }
        }

        return files;
    } catch (err: any) {
        throw new Error(`Unable to read directory "${folderPath}": ${err.message}`);
    }
}

async function validate(filePath: string): Promise<boolean> {
    try {
        const absPath = path.resolve(filePath);
        const stats = await fs.stat(absPath);
        if (!stats.isFile()) return false;
        return absPath.toLowerCase().endsWith(".png");
    } catch {
        return false;
    }
}

program
    .name("prism")
    .description("Probably Repairs Inconsistent Semi-transparency")
    .version("1.1.0")
    .option("-f, --folder <path d='/'>", "Process all .png files in the specified folder")
    .option("-r, --recursive", "Scan folders recursively (requires -f)", false)
    .argument("[files...]", "PNG images to process")
    .action(async (files: string[], options) => {
        consola.start(`Running prism v${program.version()}`);

        let targets: string[] = [];

        try {
            if (options.folder) {
                // folder mode

                const folderPath = options.folder.toString();

                if (options.recursive) {
                    consola.info(`Collecting PNG files recursively from: ${folderPath}`);
                } else {
                    consola.info(`Collecting PNG files from: ${folderPath}`);
                }

                targets = await collect(folderPath, options.recursive);

                if (targets.length === 0) {
                    consola.warn("No PNG files found in the specified folder.");
                    process.exitCode = 0;
                    return;
                }
            } else if (files.length > 0) {
                // file mode

                for (const file of files) {
                    const isValid = await validate(file);
                    if (!isValid) {
                        consola.warn(`Skipping invalid or non-PNG file: ${file}`);
                        continue;
                    }
                    targets.push(path.resolve(file));
                }

                if (targets.length === 0) {
                    consola.warn("No valid PNG files provided.");
                    process.exitCode = 0;
                    return;
                }

                if (options.recursive) {
                    consola.warn("The --recursive flag is ignored when not using --folder.");
                }

            } else {
                consola.error("No input provided. Use --folder or specify files directly.");
                program.help({ error: true });
                return;
            }

            consola.info(`Processing ${targets.length} PNG file(s)...`);

            let successCount = 0;
            let failCount = 0;

            for (const file of targets) {
                try {
                    await fix(file);
                    consola.success(`Processed: ${path.basename(file)}`);
                    successCount++;
                } catch (err: any) {
                    consola.error(`Failed to process ${file}: ${err.message}`);
                    failCount++;
                }
            }

            consola.box({
                message: `Processing complete.\nSuccess: ${successCount}\nFailed: ${failCount}`,
                title: "Summary",
            });

            process.exitCode = failCount > 0 ? 1 : 0;

        } catch (err: any) {
            consola.error(`Fatal error: ${err.message}`);
            process.exit(1);
        }
    });

program.parse(process.argv);