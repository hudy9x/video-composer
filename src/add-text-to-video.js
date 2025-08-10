#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ========================================
// CONFIGURATION - EDIT THESE SETTINGS
// ========================================
const CONFIG = {
  // Array of text overlays - each with its own timing and styling
  textOverlays: [
    {
      // Text content and timing
      text: 'First Text',
      startTime: 0,     // Start time in seconds
      endTime: 3,       // End time in seconds
      
      // Font settings
      fontSize: 172,
      fontFamily: 'Cookie-Regular.ttf', // Font file name in /fonts folder
      fontColor: 'white',
      
      // Position settings
      position: 'top-center',
      
      // Text styling
      textOutline: {
        enabled: true,
        color: 'black',
        width: 2
      },
      
      textShadow: {
        enabled: false,
        color: 'black',
        offsetX: 2,
        offsetY: 2
      },
      
      textBox: {
        enabled: false,
        color: 'black@0.5',
        padding: 10
      },
      
      // Animation (optional)
      animation: {
        enabled: false,
        type: 'fade', // 'fade', 'slide-in', 'none'
        duration: 1.0
      }
    },
    {
      // Second text overlay
      text: 'Second Text',
      startTime: 2,
      endTime: 8,
      
      fontSize: 196,
      fontFamily: 'Cookie-Regular.ttf',
      fontColor: 'yellow',
      
      position: 'bottom-center',
      
      textOutline: {
        enabled: true,
        color: 'red',
        width: 3
      },
      
      textShadow: {
        enabled: true,
        color: 'black',
        offsetX: 3,
        offsetY: 3
      },
      
      textBox: {
        enabled: false,
        color: 'blue@0.3',
        padding: 15
      },
      
      animation: {
        enabled: true,
        type: 'fade',
        duration: 0.5
      }
    },
    {
      // Third text overlay
      text: 'Final Text',
      startTime: 6,
      endTime: 10,
      
      fontSize: 196,
      fontFamily: 'Cookie-Regular.ttf',
      fontColor: 'lime',
      
      position: {
        x: '50%',
        y: '50%'
      },
      
      textOutline: {
        enabled: true,
        color: 'darkgreen',
        width: 4
      },
      
      textShadow: {
        enabled: false,
        color: 'black',
        offsetX: 2,
        offsetY: 2
      },
      
      textBox: {
        enabled: true,
        color: 'black@0.7',
        padding: 20
      },
      
      animation: {
        enabled: true,
        type: 'slide-in',
        duration: 1.0
      }
    }
  ]
};
// ========================================

function showHelp() {
  console.log(`
Video Multi-Text Overlay Tool

Usage: node add-text-to-video.js [input_file] [output_file]

Arguments:
  input_file      Path to input video file
  output_file     Path for output video file (optional)

Examples:
  node add-text-to-video.js ./video/input.mp4
  node add-text-to-video.js ./video/input.mp4 ./video/output.mp4

Configuration:
  Edit the CONFIG.textOverlays array at the top of this script to customize:
  - Multiple text overlays with individual timing
  - Each text has its own styling, position, and effects
  - startTime and endTime control when each text appears/disappears

Font Setup:
  Place your font files (.ttf, .otf) in a './fonts' folder
  Update fontFamily for each text overlay with your font filename

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
    outputFile = path.join(dir, `${name}_with_multi_text${ext}`);
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

  // Validate each text overlay
  const validatedOverlays = [];
  
  CONFIG.textOverlays.forEach((overlay, index) => {
    // Check if specified font file exists
    const fontPath = path.join(fontsDir, overlay.fontFamily);
    if (!fs.existsSync(fontPath)) {
      console.error(`Error: Font file "${overlay.fontFamily}" for text overlay ${index + 1} not found in ./fonts folder`);
      console.error(`Available fonts in ./fonts:`);
      const fonts = fs.readdirSync(fontsDir).filter(f => 
        f.endsWith('.ttf') || f.endsWith('.otf') || f.endsWith('.TTF') || f.endsWith('.OTF')
      );
      fonts.forEach(font => console.error(`  - ${font}`));
      process.exit(1);
    }
    
    // Validate timing
    if (overlay.startTime >= overlay.endTime) {
      console.error(`Error: Text overlay ${index + 1} has invalid timing. startTime (${overlay.startTime}) must be less than endTime (${overlay.endTime})`);
      process.exit(1);
    }
    
    validatedOverlays.push({
      ...overlay,
      fontPath: fontPath
    });
  });

  return validatedOverlays;
}

function getPositionCoordinates(position, videoWidth = 1920, videoHeight = 1080) {
  if (typeof position === 'object' && position.x !== undefined && position.y !== undefined) {
    let x, y;
    
    // Handle X coordinate
    if (typeof position.x === 'string' && position.x.includes('%')) {
      // Percentage positioning: '50%' -> w*0.5-text_w/2
      const percentage = parseFloat(position.x.replace('%', '')) / 100;
      x = `w*${percentage}-text_w/2`;
    } else if (typeof position.x === 'number' || (typeof position.x === 'string' && !isNaN(position.x))) {
      // Fixed pixel positioning: 1400 -> '1400'
      x = position.x.toString();
    } else {
      // Fallback to center
      x = '(w-text_w)/2';
    }
    
    // Handle Y coordinate
    if (typeof position.y === 'string' && position.y.includes('%')) {
      // Percentage positioning: '60%' -> h*0.6-text_h/2
      const percentage = parseFloat(position.y.replace('%', '')) / 100;
      y = `h*${percentage}-text_h/2`;
    } else if (typeof position.y === 'number' || (typeof position.y === 'string' && !isNaN(position.y))) {
      // Fixed pixel positioning: 1200 -> '1200'
      y = position.y.toString();
    } else {
      // Fallback to center
      y = '(h-text_h)/2';
    }
    
    return `${x}:${y}`;
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

function buildTextFilter(overlay) {
  // Escape text for FFmpeg
  const escapedText = overlay.text.replace(/'/g, "\\'").replace(/:/g, "\\:");
  
  // Build drawtext filter
  let drawtext = `drawtext=text='${escapedText}'`;
  drawtext += `:fontfile='${overlay.fontPath.replace(/\\/g, '/')}'`;
  drawtext += `:fontsize=${overlay.fontSize}`;
  drawtext += `:fontcolor=${overlay.fontColor}`;
  
  // Position
  const coordinates = getPositionCoordinates(overlay.position);
  drawtext += `:x=${coordinates.split(':')[0]}:y=${coordinates.split(':')[1]}`;
  
  // Text outline
  if (overlay.textOutline.enabled) {
    drawtext += `:borderw=${overlay.textOutline.width}:bordercolor=${overlay.textOutline.color}`;
  }
  
  // Text shadow
  if (overlay.textShadow.enabled) {
    drawtext += `:shadowx=${overlay.textShadow.offsetX}:shadowy=${overlay.textShadow.offsetY}:shadowcolor=${overlay.textShadow.color}`;
  }
  
  // Background box
  if (overlay.textBox.enabled) {
    drawtext += `:box=1:boxcolor=${overlay.textBox.color}:boxborderw=${overlay.textBox.padding}`;
  }
  
  // Timing - always apply start and end time
  if (overlay.animation.enabled && overlay.animation.type === 'fade') {
    // Fade animation with timing
    const fadeInDuration = overlay.animation.duration;
    const fadeOutDuration = overlay.animation.duration;
    const visibleDuration = overlay.endTime - overlay.startTime - fadeInDuration - fadeOutDuration;
    
    if (visibleDuration > 0) {
      const fadeInEnd = overlay.startTime + fadeInDuration;
      const fadeOutStart = overlay.endTime - fadeOutDuration;
      
      drawtext += `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
      drawtext += `:alpha='if(lt(t,${fadeInEnd}),(t-${overlay.startTime})/${fadeInDuration},if(lt(t,${fadeOutStart}),1,(${overlay.endTime}-t)/${fadeOutDuration}))'`;
    } else {
      // If fade duration is too long, just show/hide at start/end times
      drawtext += `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
    }
  } else if (overlay.animation.enabled && overlay.animation.type === 'slide-in') {
    // Slide-in animation
    const slideInEnd = overlay.startTime + overlay.animation.duration;
    drawtext += `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
    drawtext += `:x='if(lt(t,${slideInEnd}),w-(t-${overlay.startTime})/${overlay.animation.duration}*w,${coordinates.split(':')[0]})'`;
  } else {
    // No animation, just show between start and end time
    drawtext += `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
  }
  
  return drawtext;
}

function buildFFmpegCommand(inputFile, outputFile, validatedOverlays) {
  const args = ['-i', inputFile];
  
  // Build text filters for all overlays
  const textFilters = validatedOverlays.map(overlay => buildTextFilter(overlay));
  
  // Combine all filters
  if (textFilters.length > 0) {
    args.push('-vf', textFilters.join(','));
  }
  
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

function displayConfig(inputFile, outputFile, validatedOverlays) {
  console.log('Multi-Text Overlay Configuration:');
  console.log(`  Total overlays: ${validatedOverlays.length}`);
  console.log('');
  
  validatedOverlays.forEach((overlay, index) => {
    console.log(`  Text ${index + 1}:`);
    console.log(`    Text:        "${overlay.text}"`);
    console.log(`    Timing:      ${overlay.startTime}s - ${overlay.endTime}s`);
    console.log(`    Font:        ${overlay.fontFamily} (${overlay.fontSize}px)`);
    console.log(`    Color:       ${overlay.fontColor}`);
    console.log(`    Position:    ${typeof overlay.position === 'object' ? `${overlay.position.x}, ${overlay.position.y}` : overlay.position}`);
    console.log(`    Outline:     ${overlay.textOutline.enabled ? `${overlay.textOutline.color} (${overlay.textOutline.width}px)` : 'Disabled'}`);
    console.log(`    Shadow:      ${overlay.textShadow.enabled ? `${overlay.textShadow.color} (${overlay.textShadow.offsetX}, ${overlay.textShadow.offsetY})` : 'Disabled'}`);
    console.log(`    Background:  ${overlay.textBox.enabled ? overlay.textBox.color : 'Disabled'}`);
    console.log(`    Animation:   ${overlay.animation.enabled ? overlay.animation.type : 'Disabled'}`);
    console.log('');
  });
  
  console.log(`Input:  ${inputFile}`);
  console.log(`Output: ${outputFile}`);
  console.log('');
}

async function main() {
  try {
    const { inputFile, outputFile } = parseArguments();
    const validatedOverlays = validateConfig();
    
    if (validatedOverlays.length === 0) {
      console.error('Error: No text overlays configured in CONFIG.textOverlays');
      process.exit(1);
    }
    
    displayConfig(inputFile, outputFile, validatedOverlays);
    
    const ffmpegArgs = buildFFmpegCommand(inputFile, outputFile, validatedOverlays);
    
    await runFFmpeg(ffmpegArgs);
    
    console.log('');
    console.log(`✅ Multi-text overlay completed successfully!`);
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