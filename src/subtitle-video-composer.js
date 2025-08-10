const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// ===== CONFIGURATION =====
const CONFIG = {
  tempDir: path.join(__dirname, '../temp'),
  outputDir: path.join(__dirname, '../output'),
  subtitle: {
    position: 'center', // 'bottom', 'center', 'top'
    fontSize: 50,
    fontColor: 'white',
    outlineColor: 'black',
    outlineWidth: 2,
    fontFamily: 'Monaco',
    backgroundColor: 'black@0.5', // Semi-transparent black background
    marginBottom: 50, // Distance from bottom edge (for bottom position)
    marginTop: 50     // Distance from top edge (for top position)
  },
  video: {
    // You can adjust these if needed
    defaultCodec: 'libx264',
    defaultAudioCodec: 'aac'
  }
};

// ===== UTILITY FUNCTIONS =====
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

function parseTimeToSeconds(timeStr) {
  if (!timeStr) {
    return 0;
  }

  // Normalize possible formats: "HH:MM:SS", "MM:SS", or just seconds; allow trailing 's' and comma decimals
  const normalized = String(timeStr)
    .trim()
    .replace(/s$/i, '')
    .replace(',', '.');

  const parts = normalized.split(':');

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 3) {
    [hours, minutes, seconds] = parts.map(Number);
  } else if (parts.length === 2) {
    [minutes, seconds] = parts.map(Number);
  } else if (parts.length === 1) {
    seconds = Number(parts[0]);
  } else {
    return 0;
  }

  hours = Number.isFinite(hours) ? hours : 0;
  minutes = Number.isFinite(minutes) ? minutes : 0;
  seconds = Number.isFinite(seconds) ? seconds : 0;

  return hours * 3600 + minutes * 60 + seconds;
}

function createSubtitleFilter(subtitles) {
  // Return empty string if no subtitles
  if (!subtitles || subtitles.length === 0) {
    return '';
  }
  
  const { position, fontSize, fontColor, outlineColor, outlineWidth, fontFamily, backgroundColor } = CONFIG.subtitle;
  
  let yPosition;
  switch (position) {
    case 'top':
      yPosition = `y=${CONFIG.subtitle.marginTop}`;
      break;
    case 'center':
      yPosition = 'y=(h-text_h)/2';
      break;
    case 'bottom':
    default:
      yPosition = `y=h-text_h-${CONFIG.subtitle.marginBottom}`;
      break;
  }
  
  // Build subtitle filters for each segment
  const subtitleFilters = subtitles.map((subtitle, index) => {
    const [startTime, endTime] = subtitle.time.split('-');
    const startSeconds = parseTimeToSeconds(startTime);
    const endSeconds = parseTimeToSeconds(endTime);

    console.log('subtitle time', startSeconds, endSeconds)
    
    // Escape special characters in text
    const escapedText = subtitle.text
      .replace(/'/g, "'\\''")  // Escape single quotes
      .replace(/:/g, '\\:')    // Escape colons
      .replace(/\[/g, '\\[')   // Escape brackets
      .replace(/\]/g, '\\]');
    
    return `drawtext=text='${escapedText}':fontfile=/System/Library/Fonts/${fontFamily}.ttf:fontsize=${fontSize}:fontcolor=${fontColor}:borderw=${outlineWidth}:bordercolor=${outlineColor}:x=(w-text_w)/2:${yPosition}:enable='between(t,${startSeconds},${endSeconds})'`;
  });
  
  return subtitleFilters.join(',');
}

async function createSRTFile(subtitles) {
  const srtPath = path.join(CONFIG.tempDir, `subtitles_${uuidv4()}.srt`);
  
  const srtContent = subtitles.map((subtitle, index) => {
    const [startTime, endTime] = subtitle.time.split('-');
    
    // Convert to SRT time format (HH:MM:SS,mmm)
    const startSRT = startTime.replace('.', ',') + ',000';
    const endSRT = endTime.replace('.', ',') + ',000';
    
    return `${index + 1}\n${startSRT} --> ${endSRT}\n${subtitle.text}\n`;
  }).join('\n');
  
  await fs.writeFile(srtPath, srtContent);
  console.log(`✓ SRT file created: ${srtPath}`);
  return srtPath;
}

async function ensureDirectories() {
  try {
    await fs.mkdir(CONFIG.tempDir, { recursive: true });
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    console.log('✓ Directories ready');
  } catch (error) {
    throw new Error(`Failed to create directories: ${error.message}`);
  }
}

// ===== MAIN COMPOSITION FUNCTIONS =====
async function addSubtitlesToVideo(videoPath, audioPath, subtitles, outputFilename, subtitlePosition = 'bottom') {
  console.log(`\n🎬 Adding subtitles and audio to video...`);
  console.log(`📹 Video: ${videoPath}`);
  console.log(`🎵 Audio: ${audioPath}`);
  console.log(`📝 Subtitles: ${subtitles.length} segments`);
  console.log(`📍 Position: ${subtitlePosition}`);
  
  await ensureDirectories();
  
  // Update subtitle position in config
  CONFIG.subtitle.position = subtitlePosition;
  
  const outputPath = path.join(CONFIG.outputDir, outputFilename);
  
  try {
    // Check input files exist
    await fs.access(videoPath);
    await fs.access(audioPath);
    
    // Build FFmpeg arguments
    const args = [
      '-i', videoPath,      // Input video
      '-i', audioPath,      // Input audio
      '-c:v', CONFIG.video.defaultCodec,
      '-c:a', CONFIG.video.defaultAudioCodec
    ];
    
    // Add video filter only if we have subtitles
    if (subtitles && subtitles.length > 0) {
      const subtitleFilter = createSubtitleFilter(subtitles);
      args.push('-vf', subtitleFilter);
      console.log(`🔤 Adding ${subtitles.length} subtitle segments`);
    } else {
      console.log('📝 No subtitles to add, just combining video + audio');
    }
    
    // Add mapping and output options
    args.push(
      '-map', '0:v:0',      // Map video from first input
      '-map', '1:a:0',      // Map audio from second input
      '-shortest',          // End when shortest stream ends
      '-y',                 // Overwrite output
      outputPath
    );
    
    console.log('\n🔄 Processing video...');
    await runFFmpeg(args);
    
    const resultType = subtitles && subtitles.length > 0 ? 'subtitles' : 'audio';
    console.log(`\n🎉 Success! Video with ${resultType} created: ${outputPath}`);
    return outputPath;
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    throw error;
  }
}

async function composeVideoWithSubtitles(scenes, audioPath, subtitles, outputFilename, subtitlePosition = 'bottom') {
  console.log(`\n🎬 Full video composition with subtitles...`);
  
  // Import the video composer (assuming it's in the same directory)
  const { composeVideo } = require('./video-composer');
  
  try {
    // First, compose the video from scenes
    console.log('Step 1: Composing video from scenes...');
    const tempVideoName = `temp_composed_${uuidv4()}.mp4`;
    const composedVideoPath = await composeVideo(scenes, tempVideoName);
    
    // Then, add subtitles and audio
    console.log('\nStep 2: Adding subtitles and audio...');
    const finalVideoPath = await addSubtitlesToVideo(
      composedVideoPath,
      audioPath,
      subtitles,
      outputFilename,
      subtitlePosition
    );
    
    // Clean up temporary composed video
    try {
      await fs.unlink(composedVideoPath);
      console.log('✓ Temporary composed video cleaned up');
    } catch (cleanupError) {
      console.warn('⚠ Failed to cleanup temporary video');
    }
    
    return finalVideoPath;
    
  } catch (error) {
    console.error('Full composition failed:', error.message);
    throw error;
  }
}

// ===== CONVENIENCE FUNCTIONS =====
async function loadTranscriptionFromFile(jsonPath) {
  try {
    const content = await fs.readFile(jsonPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load transcription file: ${error.message}`);
  }
}

function setSubtitleStyle(options = {}) {
  // Allow customization of subtitle appearance
  Object.assign(CONFIG.subtitle, options);
  console.log('✓ Subtitle style updated:', options);
}

// ===== EXAMPLE USAGE =====
async function main() {
  // Example scenes (you'd get this from your video scanner)
  const exampleScenes = [
    { scene: 'over-shoulder', time: '4s', video: 'vid-1' },
    { scene: 'close-up', time: '3s', video: 'vid-56' },
    { scene: 'over-shoulder', time: '2s', video: 'vid-1' }
  ];
  
  // Example transcription (you'd get this from speech-to-text)
  const exampleTranscription = [
    { text: 'Hello world, welcome to our video', time: '00:00:01-00:00:04' },
    { text: 'This is a demonstration of subtitles', time: '00:00:04-00:00:07' },
    { text: 'Thank you for watching!', time: '00:00:07-00:00:09' }
  ];
  
  const audioPath = './audio/sample.mp3';
  const outputFilename = 'final_video_with_subtitles.mp4';
  
  try {
    // Customize subtitle style if needed
    setSubtitleStyle({
      fontSize: 28,
      fontColor: 'yellow',
      outlineColor: 'black',
      position: 'bottom'
    });
    
    const finalVideo = await composeVideoWithSubtitles(
      exampleScenes,
      audioPath,
      exampleTranscription,
      outputFilename,
      'bottom' // subtitle position: 'top', 'center', 'bottom'
    );
    
    console.log(`\n🎉 Final video ready: ${finalVideo}`);
    
  } catch (error) {
    console.error('Process failed:', error.message);
    process.exit(1);
  }
}

// ===== EXPORTS =====
module.exports = {
  addSubtitlesToVideo,
  composeVideoWithSubtitles,
  loadTranscriptionFromFile,
  setSubtitleStyle,
  CONFIG
};

// Run if this file is executed directly
if (require.main === module) {
  main();
}
