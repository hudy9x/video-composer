# Video Caption System Architecture

## Overview

The Video Caption System is a modular TypeScript application that adds text overlays to videos using FFmpeg. The architecture follows multiple design patterns to ensure maintainability, extensibility, and separation of concerns.

## Usage

### Prerequisites

- **Node.js** and **pnpm** package manager installed
- **FFmpeg** installed and available in system PATH
- Font files placed in `./fonts/` directory (`.ttf`, `.otf` formats supported)

### Running the Application

The caption system can be executed using the `run-caption` command defined in `package.json`:

```bash
# Basic usage - output file will be auto-generated
$ pnpm run-caption ./video/input.mp4

# Specify both input and output files
$ pnpm run-caption ./video/b-roll/C0006_9-16.MP4 ./output/only-text2.mp4

# Get help information
$ pnpm run-caption --help
$ pnpm run-caption -h
```

### Command Arguments

| Argument | Required | Description | Example |
|----------|----------|-------------|---------|
| `input_file` | ✅ Yes | Path to input video file | `./video/input.mp4` |
| `output_file` | ❌ No | Path for output video file | `./output/result.mp4` |

### Auto-generated Output Names

If no output file is specified, the system automatically generates a filename:

```bash
# Input: ./video/sample.mp4
# Output: ./video/sample_with_multi_text.mp4

# Input: ./videos/project/final.mov  
# Output: ./videos/project/final_with_multi_text.mov
```

### Configuration

Text overlays are configured through the `createDefaultConfig()` function. The current configuration includes:

- **Multi-line text support** with `\n` line breaks
- **Word-level styling** using `textElements` array
- **Responsive font sizing** (1-20 = percentage of video height, >20 = fixed pixels)
- **Animation effects** (fade-in, fade-out, slide transitions, zoom effects)
- **Text styling** (outline, shadow, background box)
- **Flexible positioning** (percentage or pixel-based)

### Font Setup

1. Create a `fonts/` directory in your project root
2. Place your font files (`.ttf`, `.otf`) in the fonts directory
3. Use font classes in configuration:

```typescript
// Available font classes
fontFamily: new Fonts_DMSerifDisplayItalic()
fontFamily: new Fonts_DMSerifDisplayRegular()
fontFamily: new Fonts_ArchivoBlack()
fontFamily: new Fonts_Cookie()
fontFamily: new Fonts_FjallaOne()
fontFamily: new Fonts_SourceSerif()
fontFamily: new Fonts_SourceSerifItalic()
```

### Example Workflow

```bash
# 1. Ensure FFmpeg is installed
$ ffmpeg -version

# 2. Place fonts in ./fonts/ directory
$ ls ./fonts/
DMSerifDisplay-Italic.ttf
DMSerifDisplay-Regular.ttf
ArchivoBlack-Regular.ttf

# 3. Run caption processing
$ pnpm run-caption ./video/input.mp4 ./output/captioned.mp4

# Output will show:
# ✅ Multi-text overlay completed successfully!
# Output file: ./output/captioned.mp4
```

### Error Handling

The system provides clear error messages for common issues:

- **Missing FFmpeg**: Guides user to install FFmpeg
- **Missing fonts**: Lists available fonts in `./fonts/` directory  
- **Invalid timing**: Validates startTime < endTime for overlays
- **Missing input file**: Validates file existence before processing

## Project Structure

```
src/caption/
├── index.ts                    # Main entry point (45 lines)
├── README.md                   # This documentation
├── type.ts                     # TypeScript interfaces and types
├── cli.ts                      # Legacy CLI (deprecated)
├── config.ts                  # Configuration management
├── cli/                       # Command-line interface
│   ├── ArgumentParser.ts       # CLI argument parsing
│   └── index.ts               # Module exports

├── services/                  # Business services
│   ├── ValidationService.ts    # Input validation
│   ├── DisplayService.ts       # Console output formatting
│   ├── FFmpegService.ts        # FFmpeg dependency checking
│   └── index.ts               # Module exports
├── processors/                # Data processing pipeline
│   ├── BaseProcessor.ts        # Chain of responsibility base
│   ├── FontPathProcessor.ts    # Font path resolution
│   ├── MultiLineProcessor.ts   # Multi-line text processing
│   └── index.ts               # Module exports
├── styles/                    # Text styling system (Decorator pattern)
├── fonts/                     # Font management system
├── effects/                   # Animation effects system
└── lib/                       # Shared utilities
```

## Design Patterns Applied

### 1. Facade Pattern
**Location**: `index.ts` (VideoTextApplication class)

The main application facade that provides a simple interface to the complex video processing system.

```typescript
export class VideoTextApplication {
  private config: Config;
  private styleManager: StyleManager;

  constructor(config: Config) {
    this.config = config;
    this.styleManager = new StyleManager();
  }

  async processVideo(inputFile: string, outputFile: string): Promise<void> {
    // Orchestrates the entire video processing pipeline
    // Hides complexity from the client
  }
}
```

### 2. Factory Pattern
**Location**: `config.ts`

Creates configuration objects with predefined settings.

```typescript
export function createDefaultConfig(): Config {
    return {
      textOverlays: [
        {
          text: "ChatGPT\nprompt for\nimages",
          fontSize: 6,
          fontFamily: new Fonts_DMSerifDisplayItalic(),
          fontColor: "white",
          // ... more configuration
        }
      ]
    };
  }

  static loadFromFile(configPath: string): Config {
    // Future: Load configuration from JSON file
    return this.createDefaultConfig();
  }
}
```

### 3. Chain of Responsibility Pattern
**Location**: `processors/`

Processes overlays through a chain of processors, each handling specific aspects.

```typescript
// Base processor
export abstract class BaseProcessor {
  protected nextProcessor?: BaseProcessor;

  setNext(processor: BaseProcessor): BaseProcessor {
    this.nextProcessor = processor;
    return processor;
  }

  process(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[] {
    const result = this.handleProcess(overlays, context);
    
    if (this.nextProcessor) {
      return this.nextProcessor.process(result, context);
    }
    
    return result;
  }

  protected abstract handleProcess(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[];
}

// Usage in VideoTextApplication
private processOverlays(videoDimensions: VideoDimensions) {
  const fontProcessor = new FontPathProcessor();
  const multiLineProcessor = new MultiLineProcessor();
  
  // Chain the processors
  fontProcessor.setNext(multiLineProcessor);

  // Process overlays through the chain
  return fontProcessor.process(this.config.textOverlays, context);
}
```

### 4. Service Layer Pattern
**Location**: `services/`

Encapsulates business logic in dedicated service classes.

```typescript
// Validation Service
export class ValidationService {
  static validateConfiguration(config: Config): void {
    // Validates fonts directory, overlay settings, timing, etc.
    BaseFont.validateFontsDirectory();
    config.textOverlays.forEach((overlay, index) => {
      this.validateOverlay(overlay, index);
    });
  }
}

// Display Service
export class DisplayService {
  static displayConfiguration(
    inputFile: string,
    outputFile: string,
    validatedOverlays: TextOverlay[],
    videoDimensions: VideoDimensions,
    config: Config
  ): void {
    // Formats and displays configuration information
  }
}
```

### 5. Command Pattern (Existing)
**Location**: `styles/` (Decorator pattern), `lib/ffmpeg/FFmpegCommandBuilder.ts` (Builder pattern)

## Core Classes

### Main Entry Point: `index.ts`

```typescript
#!/usr/bin/env node

import { createDefaultConfig } from "./config";
import { VideoTextApplication } from "./index";
import { ArgumentParser } from "./cli/ArgumentParser";
import { FFmpegService } from "./services";

/**
 * Main application entry point
 * Orchestrates the video text overlay process
 */
async function main(): Promise<void> {
  const { inputFile, outputFile } = ArgumentParser.parseArguments();
  
  // Load configuration and create application
  const config = createDefaultConfig();
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
```

### CLI Layer: `cli/ArgumentParser.ts`

```typescript
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
    // Displays comprehensive help information
  }
}
```

### Processing Pipeline: `processors/MultiLineProcessor.ts`

```typescript
export class MultiLineProcessor extends BaseProcessor {
  protected handleProcess(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[] {
    const result: TextOverlay[] = [];
    
    for (const overlay of overlays) {
      const expandedOverlays = this.parseMultiLineText(overlay, context.videoHeight);
      result.push(...expandedOverlays);
    }
    
    return result;
  }

  private parseMultiLineText(overlay: TextOverlay, videoHeight: number): TextOverlay[] {
    // Check if textElements is provided (word-level styling)
    if (overlay.textElements && overlay.textElements.length > 0) {
      return this.parseTextElements(overlay, videoHeight);
    }

    // Fallback to original multi-line parsing
    const lines = overlay.text.split("\n");
    
    // Process each line with proper positioning and spacing
    // ...
  }
}
```

## Type Definitions

### Core Types: `type.ts`

```typescript
export interface Config {
  textOverlays: TextOverlay[];
}

export interface TextOverlay {
  text: string;
  textElements?: TextElement[];
  startTime: number;
  endTime: number;
  fontSize: number;
  fontFamily: string | any;
  fontColor: string;
  position: Position;
  textAlign?: string;
  textOutline: TextOutline;
  textShadow: TextShadow;
  textBox: TextBox;
  animation: Animation;
  // Metadata fields
  _isMultiLine?: boolean;
  _originalText?: string;
  _lineIndex?: number;
  _totalLines?: number;
  _isTextElement?: boolean;
  _elementIndex?: number;
  _totalElements?: number;
  fontPath?: string;
  fontInstance?: any;
}

export interface Animation {
  enabled: boolean;
  type: any; // Effect class instance (e.g., new FadeInEffect())
  duration: number;
  delay?: number;
}

export interface ProcessingContext {
  videoHeight: number;
  videoWidth?: number;
}
```

## Integration with Existing Systems

### Font System Integration
The refactored system seamlessly integrates with the existing font classes:

```typescript
// In config.ts
fontFamily: new Fonts_DMSerifDisplayItalic(),

// In FontPathProcessor
if (typeof overlay.fontFamily !== "string") {
  fontInstance = overlay.fontFamily;
  fontPath = fontInstance.getFullPath();
}
```

### Effects System Integration
Works with existing effect classes through the animation system:

```typescript
// In configuration
animation: {
  enabled: true,
  type: new Effect_FadeIn(),
  duration: 0.5,
}

// In processing
if (overlay.animation?.enabled && overlay.animation.type) {
  const effectFilter = overlay.animation.type.generateFilter(
    overlay, 
    coordinates, 
    context.videoHeight
  );
}
```

### Styles System Integration
Leverages the existing decorator pattern for text styling:

```typescript
// In VideoTextApplication
const styleManager = new StyleManager();
const textFilters = processedOverlays.map((overlay) =>
  styleManager.buildFilter(overlay, { videoHeight: videoDimensions.height })
);
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each module has a single, well-defined responsibility
2. **Maintainability**: Easy to modify individual components without affecting others
3. **Testability**: Each class can be unit tested independently
4. **Extensibility**: Easy to add new processors, effects, or configuration sources
5. **Readability**: Clear structure with minimal, focused entry point
6. **Reusability**: Components can be used independently or in different contexts

## Usage Example

```typescript
// Simple usage
const config = createDefaultConfig();
const app = new VideoTextApplication(config);
await app.processVideo("input.mp4", "output.mp4");

// Custom configuration
const customConfig = loadConfigFromFile("custom-config.json");
const app = new VideoTextApplication(customConfig);
await app.processVideo("input.mp4", "output.mp4");

// Direct service usage
const isValid = ValidationService.validateConfiguration(config);
DisplayService.displayConfiguration(input, output, overlays, dimensions, config);
```

## Migration Notes

- The original `cli.ts` file remains for backward compatibility but is deprecated
- All complex logic has been extracted from `index.ts` into specialized modules
- The public API remains the same while internal architecture is completely refactored
- New modular structure allows for easier testing and maintenance
