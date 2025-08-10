#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ========================================
// CONFIGURATION - EDIT THESE SETTINGS
// ========================================
const CONFIG = {
  // Text content
  text: 'ChatGPT',
  
  // Font settings
  fontSize: 272,
  fontFamily: 'Cookie-Regular.ttf', // Font file name in /fonts folder
  fontColor: 'white',
  
  // Position settings
  // Can use: 'center', 'top-left', 'top-center', 'top-right', 
  //          'middle-left', 'middle-center', 'middle-right',
  //          'bottom-left', 'bottom-center', 'bottom-right'
  // Or custom coordinates: { x: 100, y: 200 }
  position: 'middle-center',
  
  // Text styling
  textOutline: {
    enabled: false,
    color: 'black',
    width: 2
  },
  
  // Text shadow
  textShadow: {
    enabled: false,
    color: 'black',
    offsetX: 2,
    offsetY: 2
  },
  
  // Background box (optional)
  textBox: {
    enabled: false,
    color: 'black@0.5', // Color with transparency
    padding: 10
  },
  
  // Animation (optional)
  animation: {
    enabled: false,
    type: 'fade', // 'fade', 'slide-in', 'none'
    duration: 1.0, // seconds
    startTime: 0   // start time in seconds
  }
};
// ========================================

function showHelp() {
  console.log(`
Video Text Overlay Tool

Usage: node add-text-to-video.js [input_file] [output_file]

Arguments:
  input_file      Path to input video file
  output_file     Path for output video file (optional)

Examples:
  node add-text-to-video.js ./video/input.mp4
  node add-text-to-video.js ./video/input.mp4 ./video/output.mp4

Configuration:
  Edit the CONFIG object at the top of this script to customize:
  - Text content and styling
  - Font family, size, and color
  - Position and alignment
  - Text effects (outline, shadow, background)
  - Animation options

Font Setup:
  Place your font files (.ttf, .otf) in a './fonts' folder
  Update CONFIG.fontFamily with your font filename

Note: This script requires FFmpeg to be installed on your system.
`);
}

function parseArguments() {
  const args = process.argv.slice(2);
  
  if (args.length < 1 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  const inputFile = args[0];
  let outputFile = args[1];

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file "${inputFile}" does not exist`);
    process.exit(1);
  }

  // Generate output filename if not provided
  if (!outputFile) {
    const dir = path.dirname(inputFile);
    const ext = path.extname(inputFile);
    const name = path.basename(inputFile, ext);
    outputFile = path.join(dir, `${name}_with_text${ext}`);
  }

  return { inputFile, outputFile };
}

function validateConfig() {
  // Check if fonts folder exists
  const fontsDir = path.join(__dirname, '../fonts');
  if (!fs.existsSync(fontsDir)) {
    console.error('Error: ./fonts folder does not exist');
    console.error('Please create a ./fonts folder and place your font files there');
    process.exit(1);
  }

  // Check if specified font file exists
  const fontPath = path.join(fontsDir, CONFIG.fontFamily);
  if (!fs.existsSync(fontPath)) {
    console.error(`Error: Font file "${CONFIG.fontFamily}" not found in ./fonts folder`);
    console.error(`Available fonts in ./fonts:`);
    const fonts = fs.readdirSync(fontsDir).filter(f => 
      f.endsWith('.ttf') || f.endsWith('.otf') || f.endsWith('.TTF') || f.endsWith('.OTF')
    );
    fonts.forEach(font => console.error(`  - ${font}`));
    process.exit(1);
  }

  return fontPath;
}

function getPositionCoordinates(position, videoWidth = 1920, videoHeight = 1080) {
  if (typeof position === 'object' && position.x !== undefined && position.y !== undefined) {
    return `${position.x}:${position.y}`;
  }

  const positions = {
    'top-left': '50:50',
    'top-center': '(w-text_w)/2:50',
    'top-right': 'w-text_w-50:50',
    'middle-left': '50:(h-text_h)/2',
    'middle-center': '(w-text_w)/2:(h-text_h)/2',
    'middle-right': 'w-text_w-50:(h-text_h)/2',
    'bottom-left': '50:h-text_h-50',
    'bottom-center': '(w-text_w)/2:h-text_h-50',
    'bottom-right': 'w-text_w-50:h-text_h-50',
    'center': '(w-text_w)/2:(h-text_h)/2'
  };

  return positions[position] || positions['center'];
}

function buildTextFilter(fontPath) {
  const filters = [];
  
  // Escape text for FFmpeg
  const escapedText = CONFIG.text.replace(/'/g, "\\'").replace(/:/g, "\\:");
  
  // Build drawtext filter
  let drawtext = `drawtext=text='${escapedText}'`;
  drawtext += `:fontfile='${fontPath.replace(/\\/g, '/')}'`;
  drawtext += `:fontsize=${CONFIG.fontSize}`;
  drawtext += `:fontcolor=${CONFIG.fontColor}`;
  
  // Position
  const coordinates = getPositionCoordinates(CONFIG.position);
  drawtext += `:x=${coordinates.split(':')[0]}:y=${coordinates.split(':')[1]}`;
  
  // Text outline
  if (CONFIG.textOutline.enabled) {
    drawtext += `:borderw=${CONFIG.textOutline.width}:bordercolor=${CONFIG.textOutline.color}`;
  }
  
  // Text shadow
  if (CONFIG.textShadow.enabled) {
    drawtext += `:shadowx=${CONFIG.textShadow.offsetX}:shadowy=${CONFIG.textShadow.offsetY}:shadowcolor=${CONFIG.textShadow.color}`;
  }
  
  // Background box
  if (CONFIG.textBox.enabled) {
    drawtext += `:box=1:boxcolor=${CONFIG.textBox.color}:boxborderw=${CONFIG.textBox.padding}`;
  }
  
  // Animation
  if (CONFIG.animation.enabled) {
    const startTime = CONFIG.animation.startTime;
    const duration = CONFIG.animation.duration;
    const endTime = startTime + duration;
    
    switch (CONFIG.animation.type) {
      case 'fade':
        drawtext += `:enable='between(t,${startTime},${endTime})'`;
        drawtext += `:alpha='if(lt(t,${startTime}),0,if(lt(t,${startTime + duration/2}),(t-${startTime})/${duration/2},1))'`;
        break;
      case 'slide-in':
        drawtext += `:enable='gte(t,${startTime})'`;
        drawtext += `:x='if(lt(t,${endTime}),w-(t-${startTime})/${duration}*w,${coordinates.split(':')[0]})'`;
        break;
    }
  }
  
  return drawtext;
}

function buildFFmpegCommand(inputFile, outputFile, fontPath) {
  const args = ['-i', inputFile];
  
  // Build text filter
  const textFilter = buildTextFilter(fontPath);
  
  // Apply video filter
  args.push('-vf', textFilter);
  
  // Output settings
  args.push(
    '-c:v', 'libx264',  // Video codec
    '-preset', 'medium', // Encoding speed/quality balance
    '-crf', '23',        // Quality setting
    '-c:a', 'copy',      // Copy audio without re-encoding
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

function displayConfig(inputFile, outputFile, fontPath) {
  console.log('Text Overlay Configuration:');
  console.log(`  Text:        "${CONFIG.text}"`);
  console.log(`  Font:        ${CONFIG.fontFamily} (${CONFIG.fontSize}px)`);
  console.log(`  Color:       ${CONFIG.fontColor}`);
  console.log(`  Position:    ${typeof CONFIG.position === 'object' ? `${CONFIG.position.x}, ${CONFIG.position.y}` : CONFIG.position}`);
  console.log(`  Outline:     ${CONFIG.textOutline.enabled ? `${CONFIG.textOutline.color} (${CONFIG.textOutline.width}px)` : 'Disabled'}`);
  console.log(`  Shadow:      ${CONFIG.textShadow.enabled ? `${CONFIG.textShadow.color} (${CONFIG.textShadow.offsetX}, ${CONFIG.textShadow.offsetY})` : 'Disabled'}`);
  console.log(`  Background:  ${CONFIG.textBox.enabled ? CONFIG.textBox.color : 'Disabled'}`);
  console.log(`  Animation:   ${CONFIG.animation.enabled ? CONFIG.animation.type : 'Disabled'}`);
  console.log('');
  console.log(`Input:  ${inputFile}`);
  console.log(`Output: ${outputFile}`);
  console.log('');
}

async function main() {
  try {
    const { inputFile, outputFile } = parseArguments();
    const fontPath = validateConfig();
    
    displayConfig(inputFile, outputFile, fontPath);
    
    const ffmpegArgs = buildFFmpegCommand(inputFile, outputFile, fontPath);
    
    await runFFmpeg(ffmpegArgs);
    
    console.log('');
    console.log(`✅ Text overlay completed successfully!`);
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