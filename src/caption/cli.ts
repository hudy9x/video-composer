#!/usr/bin/env node

import * as path from 'path';
import * as fs from 'fs';
import { CommandLineOptions } from './type';

export class CommandLineParser {
  private static showHelp(): void {
    console.log(`
Video Multi-Text Overlay Tool

Usage: node index.js [input_file] [output_file] [options]

Arguments:
  input_file      Path to input video file
  output_file     Path for output video file (optional)

Options:
  -c, --config    Path to configuration file
  -h, --help      Show this help message
  -v, --version   Show version information

Examples:
  node index.js ./video/input.mp4
  node index.js ./video/input.mp4 ./video/output.mp4
  node index.js ./video/input.mp4 -c ./config.json

Configuration:
  Edit the CONFIG object in the main file or provide a JSON config file to customize:
  - Multiple text overlays with individual timing
  - Each text has its own styling, position, and effects
  - startTime and endTime control when each text appears/disappears

Font Size System:
  - fontSize 1-20 (including decimals): Percentage of video height (responsive)
    Examples: fontSize: 2.5 = 2.5% of video height, fontSize: 8 = 8% of video height
  - fontSize > 20: Fixed pixel size (backward compatibility)
    Examples: fontSize: 120 = 120 pixels exactly

Multi-line Text:
  - Use \\n for line breaks: "Line 1\\nLine 2\\nLine 3"
  - Text blocks are automatically centered as a group
  - Use textAlign: 'left', 'center', 'right' to control horizontal alignment

Word-Level Styling (Advanced):
  - Use textElements array for individual word styling
  - Each word can have different fontSize, fontColor, animation, timing, etc.
  - Words inherit default styles unless overridden
  - Example: Different animation timing per word

Effects Available:
  - fade-in, fade-out: Smooth opacity transitions
  - slide-up, slide-down, slide-left, slide-right: Directional movement
  - zoom-in, zoom-out: Scale transitions

Font Setup:
  Place your font files (.ttf, .otf) in a './fonts' folder
  Update fontFamily for each text overlay with your font filename

Note: This script requires FFmpeg to be installed on your system.
`);
  }

  private static showVersion(): void {
    console.log('Video Multi-Text Overlay Tool v2.0.0');
  }

  static parseArguments(): CommandLineOptions {
    const args = process.argv.slice(2);
    
    if (args.length < 1 || args.includes('-h') || args.includes('--help')) {
      this.showHelp();
      process.exit(0);
    }

    if (args.includes('-v') || args.includes('--version')) {
      this.showVersion();
      process.exit(0);
    }

    const options: CommandLineOptions = {
      inputFile: args[0]
    };

    // Parse options
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '-c' || arg === '--config') {
        if (i + 1 < args.length) {
          options.configFile = args[i + 1];
          i++; // Skip next argument as it's the config file path
        }
      } else if (!arg.startsWith('-') && !options.outputFile) {
        // If it's not an option and we don't have output file yet, treat as output file
        options.outputFile = arg;
      }
    }

    // Validate input file
    if (!fs.existsSync(options.inputFile)) {
      console.error(`Error: Input file "${options.inputFile}" does not exist`);
      process.exit(1);
    }

    // Generate output filename if not provided
    if (!options.outputFile) {
      const dir = path.dirname(options.inputFile);
      const ext = path.extname(options.inputFile);
      const name = path.basename(options.inputFile, ext);
      options.outputFile = path.join(dir, `${name}_with_multi_text${ext}`);
    }

    // Validate config file if provided
    if (options.configFile && !fs.existsSync(options.configFile)) {
      console.error(`Error: Config file "${options.configFile}" does not exist`);
      process.exit(1);
    }

    return options;
  }
}
