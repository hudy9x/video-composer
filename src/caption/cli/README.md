# Command Line Interface

## Purpose

The `cli/` folder handles command-line argument parsing and help display. It provides a clean interface for users to interact with the video caption system through the command line.

## Design Pattern: Command Pattern + Static Factory

This implementation uses a combination of:

- **Command Pattern**: Encapsulates command-line operations as methods
- **Static Factory Methods**: Provides static methods for parsing and help display
- **Single Responsibility**: Focused solely on CLI concerns

## Current Implementation

```typescript
// ArgumentParser.ts
export class ArgumentParser {
  static parseArguments(): { inputFile: string; outputFile: string } {
    const args = process.argv.slice(2);

    if (args.length < 1 || args.includes("-h") || args.includes("--help")) {
      this.showHelp();
      process.exit(0);
    }

    const inputFile = args[0];
    let outputFile = args[1];

    // Auto-generate output filename if not provided
    if (!outputFile) {
      const path = require("path");
      const dir = path.dirname(inputFile);
      const ext = path.extname(inputFile);
      const name = path.basename(inputFile, ext);
      outputFile = path.join(dir, `${name}_with_multi_text${ext}`);
    }

    return { inputFile, outputFile };
  }

  private static showHelp(): void {
    // Displays comprehensive help information
  }
}
```

## Adding a New CLI Command Handler

To add support for additional command-line options (e.g., verbose mode, config file path), follow this pattern:

```typescript
// Enhanced ArgumentParser.ts
export interface ParsedArguments {
  inputFile: string;
  outputFile: string;
  verbose: boolean;
  configFile?: string;
  preset?: string;
}

export class ArgumentParser {
  static parseArguments(): ParsedArguments {
    const args = process.argv.slice(2);
    
    // Handle help first
    if (args.includes("-h") || args.includes("--help")) {
      this.showHelp();
      process.exit(0);
    }

    // Parse flags and options
    const verbose = args.includes("-v") || args.includes("--verbose");
    const configIndex = this.findOptionIndex(args, ["-c", "--config"]);
    const presetIndex = this.findOptionIndex(args, ["-p", "--preset"]);
    
    // Extract config file path if provided
    const configFile = configIndex !== -1 && args[configIndex + 1] 
      ? args[configIndex + 1] 
      : undefined;
    
    // Extract preset if provided
    const preset = presetIndex !== -1 && args[presetIndex + 1]
      ? args[presetIndex + 1]
      : undefined;

    // Get non-flag arguments (input/output files)
    const fileArgs = args.filter(arg => 
      !arg.startsWith('-') && 
      !this.isOptionValue(args, arg)
    );

    if (fileArgs.length < 1) {
      console.error("Error: Input file is required");
      this.showHelp();
      process.exit(1);
    }

    const inputFile = fileArgs[0];
    let outputFile = fileArgs[1];

    // Auto-generate output filename if not provided
    if (!outputFile) {
      const path = require("path");
      const dir = path.dirname(inputFile);
      const ext = path.extname(inputFile);
      const name = path.basename(inputFile, ext);
      outputFile = path.join(dir, `${name}_with_multi_text${ext}`);
    }

    return {
      inputFile,
      outputFile,
      verbose,
      configFile,
      preset
    };
  }

  private static findOptionIndex(args: string[], options: string[]): number {
    for (const option of options) {
      const index = args.indexOf(option);
      if (index !== -1) return index;
    }
    return -1;
  }

  private static isOptionValue(args: string[], arg: string): boolean {
    const index = args.indexOf(arg);
    if (index === 0) return false;
    
    const prevArg = args[index - 1];
    return prevArg.startsWith('-');
  }

  private static showHelp(): void {
    console.log(`
Video Multi-Text Overlay Tool

Usage: pnpm run-caption [options] <input_file> [output_file]

Arguments:
  input_file      Path to input video file
  output_file     Path for output video file (optional, auto-generated if not provided)

Options:
  -h, --help      Show this help message
  -v, --verbose   Enable verbose logging
  -c, --config    Path to configuration file
  -p, --preset    Use a configuration preset (default|minimal|cinematic)

Examples:
  pnpm run-caption ./video/input.mp4
  pnpm run-caption ./video/input.mp4 ./output/result.mp4
  pnpm run-caption -v -c custom.json ./video/input.mp4
  pnpm run-caption --preset cinematic ./video/input.mp4
  pnpm run-caption -p minimal -v ./video/input.mp4 ./output/simple.mp4

Configuration:
  - Multiple text overlays with individual timing
  - Font classes and effect classes for better organization
  - Responsive font sizing and flexible positioning
  - Animation effects and text styling options

Font Setup:
  Place your font files (.ttf, .otf) in a './fonts' folder

Note: This script requires FFmpeg to be installed on your system.
`);
  }
}
```

## Usage in Main Application

```typescript
// In index.ts
const args = ArgumentParser.parseArguments();

if (args.verbose) {
  console.log("Verbose mode enabled");
  console.log(`Input: ${args.inputFile}`);
  console.log(`Output: ${args.outputFile}`);
  if (args.configFile) console.log(`Config: ${args.configFile}`);
  if (args.preset) console.log(`Preset: ${args.preset}`);
}

// Load configuration based on CLI arguments
const config = args.configFile 
  ? ConfigFactory.loadFromFile(args.configFile)
  : args.preset
    ? ConfigFactory.createPreset(args.preset)
    : ConfigFactory.createDefaultConfig();
```
