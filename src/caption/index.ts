#!/usr/bin/env node

import { ConfigFactory } from "./config";
import { VideoTextApplication } from "./core";
import { ArgumentParser } from "./cli/ArgumentParser";
import { FFmpegService } from "./services";

/**
 * Main application entry point
 * Orchestrates the video text overlay process
 */
async function main(): Promise<void> {
  const { inputFile, outputFile } = ArgumentParser.parseArguments();
  
  // Load configuration and create application
  const config = ConfigFactory.createDefaultConfig();
  const app = new VideoTextApplication(config);
  
  // Process video with text overlays
  await app.processVideo(inputFile, outputFile);
}

/**
 * Application bootstrap
 * Checks dependencies and runs main application
 */
async function bootstrap(): Promise<void> {
  const isFFmpegAvailable = await FFmpegService.checkAvailability();
  
  if (!isFFmpegAvailable) {
    FFmpegService.handleFFmpegNotFound();
    return;
  }
  
  await main();
}

// Run the application
if (require.main === module) {
  bootstrap().catch((error) => {
    console.error(`❌ Application Error: ${error.message}`);
    process.exit(1);
  });
}
