#!/usr/bin/env node

import { Command } from "commander";
import { fixImage } from "./processor.js";
import { setDebugMode, log } from "./logger.js";

const program = new Command();

program
    .name("prism")
    .description("Probably Repairs Inconsistent Semi-transparency")
    .version("PRiSM 1.0.0")
    .option("-d, --debug", "Enable debug logging")
    .argument("<files...>", "PNG images to process")
    .action(async (files, options) => {
        if (options.debug) setDebugMode(true);

        log(`Debug mode ${options.debug ? "enabled" : "disabled"}`, "info");

        for (const file of files) {
            await fixImage(file);
        }

        log("Processing complete.", "info");
    });

program.parse();
