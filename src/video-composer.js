const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// ===== CONFIGURATION =====
const CONFIG = {
  videoDir: path.join(__dirname, '../video'),
  outputDir: path.join(__dirname, '../output'),
  tempDir: path.join(__dirname, '../temp'),
  supportedFormats: ['.mp4', '.avi', '.mov', '.mkv', '.webm'],
  defaultOutputName: 'composed_video.mp4'
};

// ===== UTILITY FUNCTIONS =====
function parseTime(timeStr) {
  // Convert time string like '4s', '1m30s', '2m' to seconds
  const match = timeStr.match(/(?:(\d+)m)?(?:(\d+)s)?/);
  if (!match) throw new Error(`Invalid time format: ${timeStr}`);

  const minutes = parseInt(match[1] || 0);
  const seconds = parseInt(match[2] || 0);
  return minutes * 60 + seconds;
}

function formatTime(seconds) {
  // Convert seconds to FFmpeg time format (HH:MM:SS)
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ffmpeg ${args.join(' ')}`);

    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`Failed to start FFmpeg: ${err.message}`));
    });
  });
}

// ===== CORE FUNCTIONS =====
async function ensureDirectories() {
  try {
    await fs.mkdir(CONFIG.tempDir, { recursive: true });
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    console.log('✓ Directories ready');
  } catch (error) {
    throw new Error(`Failed to create directories: ${error.message}`);
  }
}

async function findVideosInScene(sceneType) {
  const scenePath = path.join(CONFIG.videoDir, sceneType);

  try {
    const files = await fs.readdir(scenePath);
    const videoFiles = files.filter(file =>
      CONFIG.supportedFormats.some(ext => file.toLowerCase().endsWith(ext))
    );

    return videoFiles.map(file => ({
      filename: file,
      fullPath: path.join(scenePath, file),
      id: path.parse(file).name // filename without extension
    }));
  } catch (error) {
    throw new Error(`Scene folder '${sceneType}' not found or inaccessible: ${error.message}`);
  }
}

async function findVideoById(sceneType, videoId) {
  const availableVideos = await findVideosInScene(sceneType);
  const video = availableVideos.find(v => v.id === videoId);

  if (!video) {
    const availableIds = availableVideos.map(v => v.id).join(', ');
    throw new Error(`Video '${videoId}' not found in scene '${sceneType}'. Available: ${availableIds}`);
  }

  return video;
}

async function trimVideo(inputPath, duration, outputPath) {
  const durationSeconds = parseTime(duration);
  const args = [
    '-i', inputPath,
    '-t', durationSeconds.toString(),
    '-c', 'copy', // Copy streams without re-encoding for speed
    '-y', // Overwrite output file
    outputPath
  ];

  await runFFmpeg(args);
  console.log(`✓ Trimmed video to ${duration}: ${path.basename(outputPath)}`);
}

async function createConcatFile(videoPaths) {
  const concatFilePath = path.join(CONFIG.tempDir, `concat_${uuidv4()}.txt`);
  const concatContent = videoPaths
    .map(videoPath => `file '${path.resolve(videoPath)}'`)
    .join('\n');

  await fs.writeFile(concatFilePath, concatContent);
  return concatFilePath;
}

async function concatenateVideos(videoPaths, outputPath) {
  const concatFilePath = await createConcatFile(videoPaths);

  const args = [
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFilePath,
    '-c', 'copy',
    '-y',
    outputPath
  ];

  await runFFmpeg(args);

  // Clean up concat file
  await fs.unlink(concatFilePath);
  console.log(`✓ Videos concatenated: ${outputPath}`);
}

async function cleanupTempFiles(tempFiles) {
  for (const file of tempFiles) {
    try {
      await fs.unlink(file);
    } catch (error) {
      console.warn(`⚠ Failed to cleanup temp file: ${file}`);
    }
  }
  console.log('✓ Temporary files cleaned up');
}

// ===== MAIN PROCESSING FUNCTION =====
async function composeVideo(scenes, outputFilename = CONFIG.defaultOutputName) {
  console.log(`\n🎬 Starting video composition with ${scenes.length} scenes...`);

  await ensureDirectories();

  const tempFiles = [];
  const processedVideos = [];

  try {
    // Process each scene
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      console.log(`\n📹 Processing scene ${i + 1}/${scenes.length}: ${scene.scene}`);

      // Validate scene object
      if (!scene.scene || !scene.time || !scene.video) {
        throw new Error(`Invalid scene at index ${i}: missing required fields (scene, time, video)`);
      }

      // Find the specific video
      const video = await findVideoById(scene.scene, scene.video);

      // Create temp file for trimmed video
      const tempVideoPath = path.join(CONFIG.tempDir, `scene_${i}_${uuidv4()}.mp4`);
      tempFiles.push(tempVideoPath);

      // Trim video to specified duration
      await trimVideo(video.fullPath, scene.time, tempVideoPath);
      processedVideos.push(tempVideoPath);
    }

    // Concatenate all processed videos
    const outputPath = path.join(CONFIG.outputDir, outputFilename);
    await concatenateVideos(processedVideos, outputPath);

    console.log(`\n🎉 Success! Composed video saved: ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    throw error;
  } finally {
    // Always cleanup temp files
    if (tempFiles.length > 0) {
      await cleanupTempFiles(tempFiles);
    }
  }
}

// ===== EXAMPLE USAGE =====
// async function main() {
//   const exampleScenes = [
//     { scene: 'over-shoulder', time: '4s', video: 'vid-1' },
//     { scene: 'close-shot', time: '3s', video: 'vid-56' },
//     { scene: 'over-shoulder', time: '2s', video: 'vid-1' }
//   ];
//
//   try {
//     const outputPath = await composeVideo(exampleScenes, 'my_composed_video.mp4');
//     console.log(`Final video: ${outputPath}`);
//   } catch (error) {
//     console.error('Composition failed:', error.message);
//     process.exit(1);
//   }
// }

// ===== EXPORTS =====
module.exports = {
  composeVideo,
  findVideosInScene,
  CONFIG
};

// // Run if this file is executed directly
// if (require.main === module) {
//   main();
// }
