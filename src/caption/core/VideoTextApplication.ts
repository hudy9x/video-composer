import { Config } from '../type';
import { VideoDimensions } from '../../lib/types';
import { VideoAnalyzer } from '../../lib/video';
import { FFmpegCommandBuilder, run as runFFmpeg } from '../../lib/ffmpeg';
import { StyleManager } from '../styles';
import { ValidationService, DisplayService } from '../services';
import { FontPathProcessor, MultiLineProcessor, ProcessingContext } from '../processors';

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

      if (processedOverlays.length === 0) {
        console.error("Error: No text overlays configured in CONFIG.textOverlays");
        process.exit(1);
      }

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
      const vf = textFilters.join(",");

      // Step 6: Build and execute FFmpeg command
      const args = new FFmpegCommandBuilder()
        .input(inputFile)
        .videoFilter(vf)
        .codec("libx264")
        .preset("medium")
        .crf(23)
        .copyAudio()
        .overwrite()
        .output(outputFile)
        .build();

      await runFFmpeg(args);

      console.log("");
      console.log(`✅ Multi-text overlay completed successfully!`);
      console.log(`Output file: ${outputFile}`);
    } catch (error) {
      console.error(`❌ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  }

  private processOverlays(videoDimensions: VideoDimensions) {
    const context: ProcessingContext = {
      videoHeight: videoDimensions.height,
      videoWidth: videoDimensions.width,
    };

    // Create processing chain
    const fontProcessor = new FontPathProcessor();
    const multiLineProcessor = new MultiLineProcessor();
    
    // Chain the processors
    fontProcessor.setNext(multiLineProcessor);

    // Process overlays through the chain
    return fontProcessor.process(this.config.textOverlays, context);
  }
}
