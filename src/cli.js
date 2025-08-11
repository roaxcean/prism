#!/usr/bin/env node

import { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";
import { fixImage } from "./processor.js";
import { setDebugMode, log } from "./logger.js";

const program = new Command();

/**
 * Collect all .png files in a folder (non-recursive).
 * @param {string} folderPath - Path to directory
 * @returns {Promise<string[]>} - Array of PNG file paths
 */
async function collectPngFiles(folderPath) {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
        .map((entry) => path.join(folderPath, entry.name));
}

program
    .name("prism")
    .description("Probably Repairs Inconsistent Semi-transparency")
    .version("PRiSM 1.0.0")
    .option("-d, --debug", "Enable debug logging")
    .option("-f, --folder <path>", "Process all .png files in the specified folder")
    .argument("[files...]", "PNG images to process")
    .action(async (files, options) => {
        if (options.debug) setDebugMode(true);
        log(`Debug mode ${options.debug ? "enabled" : "disabled"}`, "info");

        let targets = [];

        if (options.folder) {
            log(`Collecting PNG files from folder: ${options.folder}`, "info");
            try {
                targets = await collectPngFiles(options.folder);
                if (targets.length === 0) {
                    log("No PNG files found in folder.", "warn");
                    return;
                }
            } catch (err) {
                log(`Failed to read folder: ${err.message}`, "error");
                process.exit(1);
            }
        } else {
            targets = files;
        }

        for (const file of targets) {
            await fixImage(file);
        }

        log("Processing complete.", "info");
    });

program.parse();
