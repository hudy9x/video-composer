export class ArgumentParser {
  static parseArguments(): { inputFile: string; outputFile: string } {
    const args = process.argv.slice(2);

    if (args.length < 1 || args.includes("-h") || args.includes("--help")) {
      this.showHelp();
      process.exit(0);
    }

    const inputFile = args[0];
    let outputFile = args[1];

    // Generate output filename if not provided
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
    console.log(`
Video Multi-Text Overlay Tool

Usage: node index.js [input_file] [output_file]

Arguments:
  input_file      Path to input video file
  output_file     Path for output video file (optional)

Examples:
  node index.js ./video/input.mp4
  node index.js ./video/input.mp4 ./video/output.mp4

Configuration:
  Configuration is managed through the ConfigFactory class
  - Multiple text overlays with individual timing
  - Each text has its own styling, position, and effects
  - Font classes and effect classes for better organization

Font Size System:
  - fontSize 1-20: Percentage of video height (responsive)
  - fontSize > 20: Fixed pixel size

Effects Available:
  - fade-in, fade-out: Smooth opacity transitions
  - slide-up, slide-down, slide-left, slide-right: Directional movement
  - zoom-in, zoom-out: Scale transitions

Font Setup:
  Place your font files (.ttf, .otf) in a './fonts' folder

Note: This script requires FFmpeg to be installed on your system.
`);
  }
}
