/**
 * Video Frame Analyzer
 *
 * This script extracts a frame from a local video file and analyzes it using Gemini AI
 *
 * Requirements:
 * - FFmpeg installed on system
 * - GEMINI_API_KEY environment variable set
 * - @google/generative-ai package installed
 *
 * Usage: node video-analyzer.js <local_video_path> [time_in_seconds]
 * Example: node video-analyzer.js "./videos/sample.mp4" 10
 * Example: node video-analyzer.js "C:/videos/movie.mp4" 5
 */
require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { spawn } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

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
        Format your response as a JSON object with keys: 'description', 'objects', 'colors', 'setting', 'people_count', 'camera_angle', and 'notable_features'.
        Only return JSON object, no other text or comments. Do not wrap the JSON object in \`\`\`json \`\`\`.`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Try to parse as JSON, fallback to structured response if parsing fails
    try {
      return JSON.parse(text);
    } catch (parseError) {
      // If Gemini doesn't return valid JSON, create a structured response
      const jsonText = text.replace(/```json\n/, '').replace(/\n```/, '');
      return {
        raw_response: text,
        json_response: JSON.parse(jsonText),
        analysis_timestamp: new Date().toISOString(),
        error: "Response was not in valid JSON format",
      };
    }
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
  const date = new Date();
  const tempImagePath = path.join(
    __dirname,
    `../temp/temp_frame_${date.getHours()}-${date.getMinutes()}.jpg`
  );

  try {
    // Extract frame from video
    console.log("Extracting frame at ", timeInSeconds, " seconds from video: ", videoPath);
    await extractFrameFromVideo(videoPath, tempImagePath, timeInSeconds);

    // Analyze the extracted frame
    console.log("Analyzing frame with Gemini: ", tempImagePath);
    const analysis = await analyzeImageWithGemini(tempImagePath);

    // Create final JSON response
    const result = {
      video_path: videoPath,
      frame_time_seconds: timeInSeconds,
      extraction_timestamp: new Date().toISOString(),
      analysis: analysis,
      status: "success",
    };

    return result;
  } catch (error) {
    return {
      video_path: videoPath,
      frame_time_seconds: timeInSeconds,
      extraction_timestamp: new Date().toISOString(),
      error: error.message,
      status: "error",
    };
  } finally {
    // Clean up temporary file
    await cleanupFile(tempImagePath);
  }
}

// Main function to run the script
async function main() {
  // Check if required environment variable is set
  if (!process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY environment variable is required");
    process.exit(1);
  }

  // Get video path from command line arguments
  const videoPath = process.argv[2];
  const timeInSeconds = parseInt(process.argv[3]) || 5;

  if (!videoPath) {
    console.error(
      "Usage: node video-analyzer.js <local_video_path> [time_in_seconds]"
    );
    console.error('Example: node video-analyzer.js "./videos/sample.mp4" 10');
    console.error('Example: node video-analyzer.js "C:/videos/movie.mp4" 5');
    process.exit(1);
  }

  console.log("Processing video:", videoPath);
  console.log("Frame time:", timeInSeconds, "seconds");

  try {
    const result = await processVideoFrame(videoPath, timeInSeconds);
    console.log("\nResult:");
    console.log(JSON.stringify(result, null, 2));
    const outputPath = path.join(
      __dirname,
      `../output/video-analysis-${new Date().toISOString()}.json`
    );
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
    console.log("Output saved to:", outputPath);
  } catch (error) {
    console.error("Error processing video:", error);
    process.exit(1);
  }
}

// Export functions for use as a module
module.exports = {
  processVideoFrame,
  extractFrameFromVideo,
  analyzeImageWithGemini,
};

// Run main function if script is executed directly
if (require.main === module) {
  main();
}
