# Application Core

## Purpose

The `core/` folder contains the main application logic using the Facade pattern. It provides a simplified interface to the complex video processing system, orchestrating all the different components into a cohesive workflow.

## Design Pattern: Facade Pattern

The Facade pattern is used to:

- **Simplify Complex Subsystems**: Hides the complexity of multiple services, processors, and managers
- **Provide Unified Interface**: Single entry point for video processing operations
- **Orchestrate Dependencies**: Manages the interaction between different components
- **Encapsulate Business Logic**: Contains the main application workflow

## Current Implementation

```typescript
// VideoTextApplication.ts
export class VideoTextApplication {
  private config: Config;
  private styleManager: StyleManager;

  constructor(config: Config) {
    this.config = config;
    this.styleManager = new StyleManager();
  }

  async processVideo(inputFile: string, outputFile: string): Promise<void> {
    try {
      // Step 1: Analyze video
      console.log("Analyzing video dimensions...");
      const videoDimensions = await VideoAnalyzer.getDimensions(inputFile);
      console.log("");

      // Step 2: Validate configuration
      ValidationService.validateConfiguration(this.config);

      // Step 3: Process overlays through chain of responsibility
      const processedOverlays = this.processOverlays(videoDimensions);

      // Step 4: Display configuration
      DisplayService.displayConfiguration(
        inputFile,
        outputFile,
        processedOverlays,
        videoDimensions,
        this.config
      );

      // Step 5: Generate video filters
      const textFilters = processedOverlays.map((overlay) =>
        this.styleManager.buildFilter(overlay, { videoHeight: videoDimensions.height })
      );

      // Step 6: Build and execute FFmpeg command
      const args = new FFmpegCommandBuilder()
        .input(inputFile)
        .videoFilter(textFilters.join(","))
        .codec("libx264")
        .preset("medium")
        .crf(23)
        .copyAudio()
        .overwrite()
        .output(outputFile)
        .build();

      await runFFmpeg(args);

      console.log("✅ Multi-text overlay completed successfully!");
    } catch (error) {
      console.error(`❌ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  }

  private processOverlays(videoDimensions: VideoDimensions) {
    // Create processing chain
    const fontProcessor = new FontPathProcessor();
    const multiLineProcessor = new MultiLineProcessor();
    
    fontProcessor.setNext(multiLineProcessor);

    return fontProcessor.process(this.config.textOverlays, {
      videoHeight: videoDimensions.height,
      videoWidth: videoDimensions.width,
    });
  }
}
```

## Adding a New Core Application Class

To add a new core application class (e.g., for batch processing multiple videos), follow this pattern:

```typescript
// BatchVideoTextApplication.ts
export class BatchVideoTextApplication {
  private config: Config;
  private styleManager: StyleManager;
  private progressCallback?: (progress: number, total: number) => void;

  constructor(
    config: Config, 
    progressCallback?: (progress: number, total: number) => void
  ) {
    this.config = config;
    this.styleManager = new StyleManager();
    this.progressCallback = progressCallback;
  }

  async processVideos(
    inputFiles: string[], 
    outputDirectory: string
  ): Promise<string[]> {
    const results: string[] = [];
    
    try {
      // Validate all input files first
      this.validateInputFiles(inputFiles);
      
      // Process each video
      for (let i = 0; i < inputFiles.length; i++) {
        const inputFile = inputFiles[i];
        const outputFile = this.generateOutputPath(inputFile, outputDirectory);
        
        console.log(`\n📹 Processing video ${i + 1}/${inputFiles.length}: ${inputFile}`);
        
        // Report progress
        if (this.progressCallback) {
          this.progressCallback(i, inputFiles.length);
        }

        // Process single video using existing logic
        await this.processSingleVideo(inputFile, outputFile);
        results.push(outputFile);
        
        console.log(`✅ Completed: ${outputFile}`);
      }

      // Final progress report
      if (this.progressCallback) {
        this.progressCallback(inputFiles.length, inputFiles.length);
      }

      console.log(`\n🎉 Batch processing completed! Processed ${results.length} videos.`);
      return results;

    } catch (error) {
      console.error(`❌ Batch processing failed: ${(error as Error).message}`);
      throw error;
    }
  }

  private async processSingleVideo(inputFile: string, outputFile: string): Promise<void> {
    // Step 1: Analyze video
    const videoDimensions = await VideoAnalyzer.getDimensions(inputFile);

    // Step 2: Validate configuration (only once per batch)
    ValidationService.validateConfiguration(this.config);

    // Step 3: Process overlays
    const processedOverlays = this.processOverlays(videoDimensions);

    // Step 4: Generate and apply filters
    const textFilters = processedOverlays.map((overlay) =>
      this.styleManager.buildFilter(overlay, { videoHeight: videoDimensions.height })
    );

    const args = new FFmpegCommandBuilder()
      .input(inputFile)
      .videoFilter(textFilters.join(","))
      .codec("libx264")
      .preset("medium")
      .crf(23)
      .copyAudio()
      .overwrite()
      .output(outputFile)
      .build();

    await runFFmpeg(args);
  }

  private processOverlays(videoDimensions: VideoDimensions) {
    const fontProcessor = new FontPathProcessor();
    const multiLineProcessor = new MultiLineProcessor();
    
    fontProcessor.setNext(multiLineProcessor);

    return fontProcessor.process(this.config.textOverlays, {
      videoHeight: videoDimensions.height,
      videoWidth: videoDimensions.width,
    });
  }

  private validateInputFiles(inputFiles: string[]): void {
    const fs = require('fs');
    
    for (const file of inputFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Input file does not exist: ${file}`);
      }
    }
  }

  private generateOutputPath(inputFile: string, outputDirectory: string): string {
    const path = require('path');
    const fs = require('fs');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    const filename = path.basename(inputFile, path.extname(inputFile));
    const extension = path.extname(inputFile);
    
    return path.join(outputDirectory, `${filename}_captioned${extension}`);
  }

  // Additional utility methods
  async estimateTotalProcessingTime(inputFiles: string[]): Promise<number> {
    // Analyze first video to estimate processing time per minute
    if (inputFiles.length === 0) return 0;
    
    const sampleVideo = inputFiles[0];
    const videoDimensions = await VideoAnalyzer.getDimensions(sampleVideo);
    const duration = await VideoAnalyzer.getDuration(sampleVideo); // Would need to implement
    
    // Rough estimation: 2x video duration for processing time
    const estimatedTimePerVideo = duration * 2;
    return estimatedTimePerVideo * inputFiles.length;
  }
}
```

## Usage Example

```typescript
// Single video processing
const config = ConfigFactory.createDefaultConfig();
const app = new VideoTextApplication(config);
await app.processVideo("input.mp4", "output.mp4");

// Batch processing with progress tracking
const batchApp = new BatchVideoTextApplication(
  config,
  (current, total) => {
    const percentage = Math.round((current / total) * 100);
    console.log(`Progress: ${percentage}% (${current}/${total})`);
  }
);

const inputFiles = ["video1.mp4", "video2.mp4", "video3.mp4"];
const results = await batchApp.processVideos(inputFiles, "./output/");
```
