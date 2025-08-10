#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function showHelp() {
  console.log(`
Video Aspect Ratio Converter

Usage: node convert-ratio.js [ratio] [input_file] [rotation_angle]

Arguments:
  ratio           Target aspect ratio (16-9 or 9-16)
  input_file      Path to input video file
  rotation_angle  Rotation angle in degrees (optional, default: 0)

Examples:
  node convert-ratio.js 9-16 ./video/V0034.mp4
  node convert-ratio.js 16-9 ./video/V0034.mp4 90
  node convert-ratio.js 9-16 ./video/V0034.mp4 -90

Note: This script requires FFmpeg to be installed on your system.
`);
}

function parseArguments() {
  const args = process.argv.slice(2);
  
  if (args.length < 2 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  const ratio = args[0];
  const inputFile = args[1];
  const rotationAngle = args[2] ? parseInt(args[2]) : 0;

  // Validate ratio format
  if (!['16-9', '9-16'].includes(ratio)) {
    console.error('Error: Ratio must be either "16-9" or "9-16"');
    process.exit(1);
  }

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file "${inputFile}" does not exist`);
    process.exit(1);
  }

  // Validate rotation angle
  if (isNaN(rotationAngle)) {
    console.error('Error: Rotation angle must be a valid number');
    process.exit(1);
  }

  return { ratio, inputFile, rotationAngle };
}

function generateOutputFilename(inputFile, ratio, rotationAngle) {
  const dir = path.dirname(inputFile);
  const ext = path.extname(inputFile);
  const name = path.basename(inputFile, ext);
  
  let suffix = `_${ratio}`;
  if (rotationAngle !== 0) {
    suffix += `_rot${rotationAngle}`;
  }
  
  return path.join(dir, `${name}${suffix}${ext}`);
}

function buildFFmpegCommand(inputFile, outputFile, ratio, rotationAngle) {
  const args = ['-i', inputFile];
  
  // Video filters array
  const filters = [];
  
  // Add rotation filter if needed
  if (rotationAngle !== 0) {
    // Convert degrees to radians for FFmpeg
    const radians = (rotationAngle * Math.PI) / 180;
    filters.push(`rotate=${radians}`);
  }
  
  // Add aspect ratio conversion by transposing dimensions
  if (ratio === '9-16') {
    // Convert from 16:9 to 9:16 (portrait)
    // Transpose the video (swap width and height)
    filters.push('transpose=1');
  } else if (ratio === '16-9') {
    // Convert from 9:16 to 16:9 (landscape)  
    // Transpose the video (swap width and height)
    filters.push('transpose=1');
  }
  
  // Apply video filters if any
  if (filters.length > 0) {
    args.push('-vf', filters.join(','));
  }
  
  // Output settings
  args.push(
    '-c:v', 'libx264',  // Video codec
    '-preset', 'medium', // Encoding speed/quality balance
    '-crf', '23',        // Quality setting (lower = better quality)
    '-c:a', 'aac',       // Audio codec
    '-b:a', '128k',      // Audio bitrate
    '-y',                // Overwrite output file
    outputFile
  );
  
  return args;
}

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    console.log('Running FFmpeg command:');
    console.log(`ffmpeg ${args.join(' ')}`);
    console.log('');
    
    const ffmpeg = spawn('ffmpeg', args);
    
    ffmpeg.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    ffmpeg.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
    
    ffmpeg.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('FFmpeg not found. Please install FFmpeg and make sure it\'s in your PATH.'));
      } else {
        reject(err);
      }
    });
  });
}

async function main() {
  try {
    const { ratio, inputFile, rotationAngle } = parseArguments();
    const outputFile = generateOutputFilename(inputFile, ratio, rotationAngle);
    
    console.log(`Converting video:`);
    console.log(`  Input:    ${inputFile}`);
    console.log(`  Output:   ${outputFile}`);
    console.log(`  Ratio:    ${ratio.replace('-', ':')}`);
    console.log(`  Rotation: ${rotationAngle}°`);
    console.log('');
    
    const ffmpegArgs = buildFFmpegCommand(inputFile, outputFile, ratio, rotationAngle);
    
    await runFFmpeg(ffmpegArgs);
    
    console.log('');
    console.log(`✅ Conversion completed successfully!`);
    console.log(`Output file: ${outputFile}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Check if FFmpeg is available
function checkFFmpeg() {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });
    
    ffmpeg.on('error', () => {
      resolve(false);
    });
  });
}

// Run the main function
if (require.main === module) {
  checkFFmpeg().then((isAvailable) => {
    if (!isAvailable) {
      console.error('❌ FFmpeg is not installed or not found in PATH.');
      console.error('Please install FFmpeg from https://ffmpeg.org/download.html');
      process.exit(1);
    }
    main();
  });
}