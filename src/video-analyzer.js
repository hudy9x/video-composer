/**
 * Video Frame Analyzer
 *
 * This script extracts a frame from a local video file and analyzes it using Gemini AI
 * Now supports batch processing of all videos in a folder
 *
 * Requirements:
 * - FFmpeg installed on system
 * - GEMINI_API_KEY environment variable set
 * - @google/generative-ai package installed
 *
 * Usage: 
 * - Single video: node video-analyzer.js <local_video_path> [time_in_seconds]
 * - All videos: node video-analyzer.js --all [time_in_seconds]
 * 
 * Examples: 
 * - node video-analyzer.js "./videos/sample.mp4" 10
 * - node video-analyzer.js --all 5
 * - node video-analyzer.js --all
 */
require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { spawn } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuration
const VIDEO_FOLDER = path.join(__dirname, "../video");
const TEMP_FOLDER = path.join(__dirname, "../temp");

// Supported video extensions
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v'];

async function ensureDirectories() {
  try {
    await fs.mkdir(TEMP_FOLDER, { recursive: true });
  } catch (error) {
    console.error("Error creating directories:", error);
  }
}

function getVideoNameWithoutExtension(videoPath) {
  const basename = path.basename(videoPath);
  const extension = path.extname(basename);
  return basename.replace(extension, '');
}

function getOutputFileName(videoPath) {
  const videoName = getVideoNameWithoutExtension(videoPath);
  return `${videoName}-analysis.md`;
}

function getOutputFilePath(videoPath) {
  const videoDir = path.dirname(videoPath);
  const videoName = getVideoNameWithoutExtension(videoPath);
  const outputFileName = `${videoName}-analysis.md`;
  return path.join(videoDir, outputFileName);
}

async function isVideoAlreadyAnalyzed(videoPath) {
  const outputPath = getOutputFilePath(videoPath);
  try {
    const content = await fs.readFile(outputPath, 'utf-8');
    const containsErrorMarker =
      content.includes('# Video Frame Analysis Error') ||
      content.includes('Status: error');
    // Treat error-marked files as not analyzed so they can be retried
    return !containsErrorMarker;
  } catch {
    return false;
  }
}

async function getAllVideoFiles() {
  const videoFiles = [];
  
  try {
    // Get all subdirectories in the video folder
    const items = await fs.readdir(VIDEO_FOLDER, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        const categoryPath = path.join(VIDEO_FOLDER, item.name);
        
        // Scan files in each category folder
        try {
          const categoryFiles = await fs.readdir(categoryPath);
          
          for (const file of categoryFiles) {
            const ext = path.extname(file).toLowerCase();
            if (VIDEO_EXTENSIONS.includes(ext)) {
              videoFiles.push(path.join(categoryPath, file));
            }
          }
        } catch (error) {
          console.error(`Error scanning category folder ${categoryPath}:`, error);
        }
      }
    }
    
    return videoFiles;
  } catch (error) {
    console.error("Error reading video folders:", error);
    return [];
  }
}

async function extractFrameFromVideo(videoPath, outputPath, timeInSeconds = 5) {
  return new Promise((resolve, reject) => {
    // FFmpeg command to extract a single frame at specified time
    const ffmpegArgs = [
      "-ss",
      timeInSeconds.toString(), // Seek to time position
      "-i",
      videoPath, // Input video file path
      "-vframes",
      "1", // Extract only 1 frame
      "-q:v",
      "2", // High quality
      "-y", // Overwrite output file if exists
      outputPath, // Output path
    ];

    const ffmpeg = spawn("ffmpeg", ffmpegArgs);

    let stderr = "";

    // Capture stderr for error messages
    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        console.log("Frame extracted successfully");
        resolve(outputPath);
      } else {
        console.error("FFmpeg stderr:", stderr);
        reject(new Error(`FFmpeg process exited with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on("error", (err) => {
      console.error("Error spawning ffmpeg:", err);
      reject(err);
    });
  });
}

async function analyzeImageWithGemini(imagePath) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Read the image file
    const imageData = await fs.readFile(imagePath);
    const base64Image = imageData.toString("base64");

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg",
      },
    };

    const prompt = `Analyze this image and provide a detailed description including objects, people, colors, setting, camera_angle, and any notable features. 
        Produce a clear, human-readable Markdown report with the following sections and headings:

        # Description
        A concise paragraph describing the scene. max (100 words)

        # Objects
        A bullet list of notable objects. max (3 objects)

        # Colors
        A bullet list of dominant colors. max (3 colors)

        # Setting
        A short description of the environment and context. max (50 words)

        # People
        Estimated people_count as an integer (if none, use 0) and a short note about appearance/pose. max (20 words)

        # Camera Angle
        One of: close-up, medium, wide, over-shoulder, POV, or other; include rationale. max (20 words)

        # Notable Features
        Bullet list of distinctive details. max (5 features)

        Return only Markdown text (no code fences).`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw error;
  }
}

async function cleanupFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log("Temporary file cleaned up:", filePath);
  } catch (error) {
    console.error("Error cleaning up file:", error);
  }
}

async function processVideoFrame(videoPath, timeInSeconds = 5) {
  const videoName = getVideoNameWithoutExtension(videoPath);
  const videoDir = path.dirname(videoPath);
  const frameImagePath = path.join(videoDir, `${videoName}_frame_${timeInSeconds}.jpg`);

  try {
    // Extract frame from video
    console.log("Extracting frame at", timeInSeconds, "seconds from video:", videoPath);
    await extractFrameFromVideo(videoPath, frameImagePath, timeInSeconds);
    console.log("Saved extracted frame to:", frameImagePath);

    // Analyze the extracted frame
    console.log("Analyzing frame with Gemini:", frameImagePath);
    const analysisMarkdown = await analyzeImageWithGemini(frameImagePath);

    // Build Markdown document
    const markdownDoc = `# Video Frame Analysis: ${videoName}\n\n- Video path: ${videoPath}\n- Frame time (s): ${timeInSeconds}\n- Extraction timestamp: ${new Date().toISOString()}\n\n---\n\n## AI Analysis\n\n${analysisMarkdown}\n`;

    return markdownDoc;
  } catch (error) {
    // Propagate error so caller can decide not to write any file
    throw new Error(`Video analysis failed for ${path.basename(videoPath)}: ${error.message}`);
  } finally {
    // Keep the extracted frame next to the video as requested
  }
}

async function processSingleVideo(videoPath, timeInSeconds = 5, force = false) {
  console.log("\n" + "=".repeat(60));
  console.log("Processing video:", videoPath);
  console.log("Frame time:", timeInSeconds, "seconds");

  // Check if already analyzed
  if (!force && (await isVideoAlreadyAnalyzed(videoPath))) {
    console.log("⚠️  Video already analyzed, skipping... (use --force to overwrite)");
    const outputPath = getOutputFilePath(videoPath);
    console.log("Existing analysis found at:", outputPath);
    return { skipped: true, outputPath };
  }

  try {
    const markdown = await processVideoFrame(videoPath, timeInSeconds);

    // Save result with video name
    const outputPath = getOutputFilePath(videoPath);
    await fs.writeFile(outputPath, markdown, "utf-8");

    console.log("\n✅ Markdown analysis saved to:", outputPath);

    return { success: true, outputPath, forced: force };
  } catch (error) {
    console.error("❌ Error processing video. Skipping write:", error.message);
    return { error: true, message: error.message };
  }
}

async function processAllVideos(timeInSeconds = 5, force = false) {
  console.log("🔍 Scanning for videos recursively in:", VIDEO_FOLDER);
  
  const videoFiles = await getAllVideoFiles();
  
  if (videoFiles.length === 0) {
    console.log("❌ No video files found in the videos folder or its subfolders");
    console.log("Supported extensions:", VIDEO_EXTENSIONS.join(", "));
    return;
  }

  // Group videos by category for better display
  const videosByCategory = {};
  videoFiles.forEach(file => {
    const category = path.basename(path.dirname(file));
    if (!videosByCategory[category]) {
      videosByCategory[category] = [];
    }
    videosByCategory[category].push(file);
  });

  console.log(`📹 Found ${videoFiles.length} video files in ${Object.keys(videosByCategory).length} categories:`);
  Object.entries(videosByCategory).forEach(([category, files]) => {
    console.log(`  📁 ${category}: ${files.length} videos`);
    files.forEach((file, index) => {
      console.log(`     ${index + 1}. ${path.basename(file)}`);
    });
  });

  const results = {
    total: videoFiles.length,
    processed: 0,
    skipped: 0,
    errors: 0,
    byCategory: {},
    details: []
  };

  // Initialize category stats
  Object.keys(videosByCategory).forEach(category => {
    results.byCategory[category] = {
      total: videosByCategory[category].length,
      processed: 0,
      skipped: 0,
      errors: 0
    };
  });

  for (let i = 0; i < videoFiles.length; i++) {
    const videoPath = videoFiles[i];
    const videoName = path.basename(videoPath);
    const category = path.basename(path.dirname(videoPath));
    
    console.log(`\n🎬 Processing ${i + 1}/${videoFiles.length}: ${category}/${videoName}`);
    
    const result = await processSingleVideo(videoPath, timeInSeconds, force);
    
    // Update overall stats
    if (result.skipped) {
      results.skipped++;
      results.byCategory[category].skipped++;
    } else if (result.success) {
      results.processed++;
      results.byCategory[category].processed++;
    } else {
      results.errors++;
      results.byCategory[category].errors++;
    }
    
    results.details.push({
      category: category,
      video: videoName,
      result: result
    });
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 BATCH PROCESSING COMPLETE");
  console.log("=".repeat(60));
  console.log(`📊 Overall Summary:`);
  console.log(`   Total videos: ${results.total}`);
  console.log(`   ✅ Processed: ${results.processed}`);
  console.log(`   ⚠️  Skipped: ${results.skipped}`);
  console.log(`   ❌ Errors: ${results.errors}`);
  
  console.log(`\n📂 By Category:`);
  Object.entries(results.byCategory).forEach(([category, stats]) => {
    console.log(`   ${category}: ${stats.total} total (✅${stats.processed} ⚠️${stats.skipped} ❌${stats.errors})`);
  });
  
  console.log(`\n📁 Output files are saved next to their source videos.`);
}

// Main function to run the script
async function main() {
  // Check if required environment variable is set
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY environment variable is required");
    process.exit(1);
  }

  // Ensure directories exist
  await ensureDirectories();

  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error("Usage:");
    console.error("  Single video: node video-analyzer.js <local_video_path> [time_in_seconds] [--force]");
    console.error("  All videos:   node video-analyzer.js --all [time_in_seconds] [--force]");
    console.error("");
    console.error("Examples:");
    console.error('  node video-analyzer.js "./videos/sample.mp4" 10 --force');
    console.error('  node video-analyzer.js --all 5 --force');
    console.error('  node video-analyzer.js --all');
    process.exit(1);
  }

  const firstArg = args[0];
  const hasForce = args.includes("--force");
  
  if (firstArg === "--all") {
    // Batch processing mode
    const timeInSeconds = parseInt(args[1]) || 5;
    console.log("🚀 Starting batch processing mode...");
    console.log("⏰ Frame extraction time:", timeInSeconds, "seconds");
    if (hasForce) console.log("🔁 Force overwrite is ON");
    await processAllVideos(timeInSeconds, hasForce);
  } else {
    // Single video mode
    const videoPath = firstArg;
    // time may be in args[1] or args[1] could be --force
    const maybeTime = parseInt(args[1]);
    const timeInSeconds = Number.isNaN(maybeTime) ? 5 : maybeTime;
    if (hasForce) console.log("🔁 Force overwrite is ON");
    await processSingleVideo(videoPath, timeInSeconds, hasForce);
  }
}

// Export functions for use as a module
module.exports = {
  processVideoFrame,
  extractFrameFromVideo,
  analyzeImageWithGemini,
  processSingleVideo,
  processAllVideos,
  getAllVideoFiles,
  isVideoAlreadyAnalyzed
};

// Run main function if script is executed directly
if (require.main === module) {
  main();
}