#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { Position, TextOutline, TextShadow, TextBox, Animation, TextElement, TextOverlay, Config, VideoDimensions } from './type';

// ========================================
// CONFIGURATION - EDIT THESE SETTINGS
// ========================================
const CONFIG: Config = {
  // Array of text overlays - each with its own timing and styling
  textOverlays: [
    {
      // Multi-line text example with word-level styling
      text: 'ChatGPT\nprompt for\nimages',
      
      // NEW: Word-level styling (optional)
      textElements: [
        {
          text: 'ChatGPT',
          line: 0,
          // Uses default styles from parent
        },
        {
          text: 'prompt for',
          line: 1,
          // Uses default styles from parent
        },
        {
          text: 'images',
          line: 2,
          // Custom styling for this word only
          fontSize: 8,                    // Bigger than default
          fontColor: 'gold',              // Different color
          textOutline: { enabled: true, color: 'red', width: 4 }, // Red outline
          textShadow: { enabled: true, color: 'purple', offsetX: 3, offsetY: 3 }, // Purple shadow
          animation: { enabled: true, type: 'fade', duration: 1.0 }, // Different animation
          
          // Different timing - appears after other text
          startTime: 5,  // Starts 3 seconds after "ChatGPT prompt for"
          endTime: 9
        }
      ],
      
      // Default styles (inherited by all textElements unless overridden)
      startTime: 2,
      endTime: 7,
      
      fontSize: 6,  // 6% of video height - will scale automatically
      fontFamily: 'DMSerifDisplay-Italic.ttf',
      fontColor: 'white',
      
      // Position for the entire text block - will be auto-positioned
      position: { x: '50%', y: '50%' },
      
      // Text alignment for multi-line text: 'left', 'center', 'right'
      textAlign: 'center',
      
      textOutline: {
        enabled: true,
        color: 'black',
        width: 3
      },
      
      textShadow: {
        enabled: true,
        color: 'black',
        offsetX: 2,
        offsetY: 2
      },
      
      textBox: {
        enabled: false,
        color: 'black@0.5',
        padding: 10
      },
      
      animation: {
        enabled: true,
        type: 'fade',
        duration: 0.5
      }
    },

    {
      // Multi-line text example with word-level styling
      text: 'I am a\nsoftware engineer',
      
      // Default styles (inherited by all textElements unless overridden)
      startTime: 10,
      endTime: 14,
      
      fontSize: 5,  // 6% of video height - will scale automatically
      fontFamily: 'DMSerifDisplay-Italic.ttf',
      fontColor: 'white',
      
      // Position for the entire text block - will be auto-positioned
      position: { x: '50%', y: '50%' },
      
      // Text alignment for multi-line text: 'left', 'center', 'right'
      textAlign: 'center',
      
      textOutline: {
        enabled: true,
        color: 'black',
        width: 3
      },
      
      textShadow: {
        enabled: true,
        color: 'black',
        offsetX: 2,
        offsetY: 2
      },
      
      textBox: {
        enabled: false,
        color: 'black@0.5',
        padding: 10
      },
      
      animation: {
        enabled: true,
        type: 'fade',
        duration: 0.5
      }
    }
  ]
};
// ========================================

function showHelp(): void {
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

Font Size System:
  - fontSize 1-20 (including decimals): Percentage of video height (responsive)
    Examples: fontSize: 2.5 = 2.5% of video height, fontSize: 8 = 8% of video height
  - fontSize > 20: Fixed pixel size (backward compatibility)
    Examples: fontSize: 120 = 120 pixels exactly

Multi-line Text:
  - Use \\n for line breaks: "Line 1\\nLine 2\\nLine 3"
  - Text blocks are automatically centered as a group
  - Use textAlign: 'left', 'center', 'right' to control horizontal alignment

Word-Level Styling (Advanced):
  - Use textElements array for individual word styling
  - Each word can have different fontSize, fontColor, animation, timing, etc.
  - Words inherit default styles unless overridden
  - Example: Different animation timing per word

Font Setup:
  Place your font files (.ttf, .otf) in a './fonts' folder
  Update fontFamily for each text overlay with your font filename

Note: This script requires FFmpeg to be installed on your system.
`);
}

function parseArguments(): { inputFile: string; outputFile: string } {
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

function getVideoDimensions(inputFile: string): Promise<VideoDimensions> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputFile,
      '-hide_banner',
      '-f', 'null',
      '-'
    ]);

    let output = '';
    
    // FFmpeg outputs video info to stderr
    ffmpeg.stderr.on('data', (data) => {
      output += data.toString();
    });

    ffmpeg.on('close', (code) => {
      // FFmpeg exits with code 0 or sometimes 1 when using -f null, both are OK
      if (code === 0 || code === 1) {
        try {
          // Parse video dimensions from FFmpeg output
          // Look for patterns like "1920x1080" or "Video: h264, yuv420p, 1920x1080"
          const dimensionMatch = output.match(/(\d{3,5})x(\d{3,5})/);
          
          if (dimensionMatch) {
            const width = parseInt(dimensionMatch[1]);
            const height = parseInt(dimensionMatch[2]);
            
            resolve({
              width: width,
              height: height
            });
          } else {
            reject(new Error('Could not parse video dimensions from FFmpeg output'));
          }
        } catch (error) {
          reject(new Error('Failed to parse video information'));
        }
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (err: any) => {
      if (err.code === 'ENOENT') {
        reject(new Error('FFmpeg not found. Please install FFmpeg and make sure it\'s in your PATH.'));
      } else {
        reject(err);
      }
    });
  });
}

function calculateFontSize(fontSize: number, videoHeight: number, silent: boolean = false): number {
  // Font size system:
  // 1-20 (including decimals): Percentage of video height
  // > 20: Fixed pixel size
  
  if (fontSize <= 20) {
    // Treat as percentage of video height
    const calculatedSize = Math.round((fontSize / 100) * videoHeight);
    if (!silent) {
      console.log(`    Font size: ${fontSize}% of video height = ${calculatedSize}px`);
    }
    return calculatedSize;
  } else {
    // Treat as fixed pixel size
    if (!silent) {
      console.log(`    Font size: ${fontSize}px (fixed)`);
    }
    return fontSize;
  }
}

function parseMultiLineText(overlay: TextOverlay, videoHeight: number): TextOverlay[] {
  // Check if textElements is provided (new word-level styling)
  if (overlay.textElements && overlay.textElements.length > 0) {
    return parseTextElements(overlay, videoHeight);
  }
  
  // Fallback to original multi-line parsing
  const lines = overlay.text.split('\n');
  
  // If single line, return as-is
  if (lines.length === 1) {
    return [overlay];
  }
  
  // Calculate line spacing and total height
  const fontSize = calculateFontSize(overlay.fontSize, videoHeight, true);
  const lineSpacing = 1.2; // Standard line spacing multiplier
  const lineHeight = fontSize * lineSpacing;
  const totalHeight = lineHeight * lines.length;
  
  // Calculate starting Y position to center the entire text block
  const startingY = calculateStartingYForBlock(overlay.position.y, totalHeight, videoHeight);
  
  // Create separate overlay for each line
  return lines.map((line, index) => ({
    ...overlay,
    text: line.trim(), // Remove any extra whitespace
    position: {
      x: overlay.position.x,
      y: startingY + (index * lineHeight)
    },
    // Pass through textAlign for positioning
    textAlign: overlay.textAlign || 'center',
    // Add metadata for display purposes
    _isMultiLine: true,
    _originalText: overlay.text,
    _lineIndex: index,
    _totalLines: lines.length
  }));
}

function parseTextElements(overlay: TextOverlay, videoHeight: number): TextOverlay[] {
  // Group elements by line to calculate line heights
  const lineGroups: { [key: number]: TextElement[] } = {};
  overlay.textElements!.forEach(element => {
    if (!lineGroups[element.line]) {
      lineGroups[element.line] = [];
    }
    lineGroups[element.line].push(element);
  });
  
  // Calculate the maximum font size per line for proper spacing
  const lineHeights: { [key: number]: number } = {};
  const lineSpacing = 1.2;
  
  Object.keys(lineGroups).forEach(lineNumStr => {
    const lineNum = parseInt(lineNumStr);
    const elements = lineGroups[lineNum];
    const maxFontSize = Math.max(...elements.map(el => {
      const fontSize = el.fontSize !== undefined ? el.fontSize : overlay.fontSize;
      return calculateFontSize(fontSize, videoHeight, true);
    }));
    lineHeights[lineNum] = maxFontSize * lineSpacing;
  });
  
  // Calculate total height of all lines
  const sortedLines = Object.keys(lineHeights).sort((a, b) => parseInt(a) - parseInt(b));
  const totalHeight = sortedLines.reduce((sum, lineNumStr) => sum + lineHeights[parseInt(lineNumStr)], 0);
  
  // Calculate starting Y position
  const startingY = calculateStartingYForBlock(overlay.position.y, totalHeight, videoHeight);
  
  // Calculate Y position for each line
  const lineYPositions: { [key: number]: number } = {};
  let currentY = startingY;
  sortedLines.forEach(lineNumStr => {
    const lineNum = parseInt(lineNumStr);
    lineYPositions[lineNum] = currentY;
    currentY += lineHeights[lineNum];
  });
  
  // Create overlay for each text element
  return overlay.textElements!.map((element, index) => {
    // Merge default overlay properties with element-specific overrides
    const mergedElement = {
      ...overlay,  // Start with all default properties
      ...element,  // Override with element-specific properties
      text: element.text,  // Ensure text is from element
      position: {
        x: overlay.position.x,
        y: lineYPositions[element.line]
      },
      textAlign: element.textAlign || overlay.textAlign || 'center',
      
      // Merge nested objects properly
      textOutline: {
        ...overlay.textOutline,
        ...(element.textOutline || {})
      },
      textShadow: {
        ...overlay.textShadow,
        ...(element.textShadow || {})
      },
      textBox: {
        ...overlay.textBox,
        ...(element.textBox || {})
      },
      animation: {
        ...overlay.animation,
        ...(element.animation || {})
      },
      
      // Add metadata
      _isTextElement: true,
      _originalText: overlay.text,
      _elementIndex: index,
      _totalElements: overlay.textElements!.length,
      _lineIndex: element.line
    };
    
    return mergedElement;
  });
}

function calculateStartingYForBlock(originalY: string | number, totalHeight: number, videoHeight: number): number {
  if (typeof originalY === 'string' && originalY.includes('%')) {
    // Handle percentage positioning
    const percentage = parseFloat(originalY.replace('%', '')) / 100;
    const centerY = videoHeight * percentage;
    const startY = centerY - (totalHeight / 2);
    return startY;
  } else if (typeof originalY === 'number' || (typeof originalY === 'string' && !isNaN(parseFloat(originalY)))) {
    // Handle fixed pixel positioning
    const centerY = typeof originalY === 'number' ? originalY : parseFloat(originalY);
    const startY = centerY - (totalHeight / 2);
    return startY;
  } else {
    // Fallback to center
    const centerY = videoHeight / 2;
    const startY = centerY - (totalHeight / 2);
    return startY;
  }
}

function validateConfig(videoHeight: number): TextOverlay[] {
  // Check if fonts folder exists
  const fontsDir = path.join(__dirname, '../../fonts');
  if (!fs.existsSync(fontsDir)) {
    console.error('Error: ./fonts folder does not exist');
    console.error('Please create a ./fonts folder and place your font files there');
    process.exit(1);
  }

  // Validate each text overlay
  const validatedOverlays: TextOverlay[] = [];
  
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
    
    // Validate font size
    if (overlay.fontSize <= 0) {
      console.error(`Error: Text overlay ${index + 1} has invalid fontSize. Must be greater than 0`);
      process.exit(1);
    }
    
    // Add font path to overlay
    const overlayWithFont = {
      ...overlay,
      fontPath: fontPath
    };
    
    // Parse multi-line text and expand into separate overlays
    const expandedOverlays = parseMultiLineText(overlayWithFont, videoHeight);
    validatedOverlays.push(...expandedOverlays);
  });

  return validatedOverlays;
}

function getPositionCoordinates(position: string | Position, videoWidth: number = 1920, videoHeight: number = 1080, textAlign: 'left' | 'center' | 'right' = 'center'): string {
  if (typeof position === 'object' && position.x !== undefined && position.y !== undefined) {
    let x: string, y: string;
    
    // Handle X coordinate with text alignment
    if (typeof position.x === 'string' && position.x.includes('%')) {
      const percentage = parseFloat(position.x.replace('%', '')) / 100;
      
      // Apply text alignment
      switch (textAlign) {
        case 'left':
          x = `w*${percentage}`;
          break;
        case 'right':
          x = `w*${percentage}-text_w`;
          break;
        case 'center':
        default:
          x = `w*${percentage}-text_w/2`;
          break;
      }
    } else if (typeof position.x === 'number' || (typeof position.x === 'string' && !isNaN(parseFloat(position.x)))) {
      // Fixed pixel positioning with alignment
      const pixelX = typeof position.x === 'number' ? position.x : parseFloat(position.x);
      switch (textAlign) {
        case 'left':
          x = pixelX.toString();
          break;
        case 'right':
          x = `${pixelX}-text_w`;
          break;
        case 'center':
        default:
          x = `${pixelX}-text_w/2`;
          break;
      }
    } else {
      // Fallback to center
      x = '(w-text_w)/2';
    }
    
    // Handle Y coordinate (unchanged)
    if (typeof position.y === 'string' && position.y.includes('%')) {
      // Percentage positioning: '60%' -> h*0.6-text_h/2
      const percentage = parseFloat(position.y.replace('%', '')) / 100;
      y = `h*${percentage}-text_h/2`;
    } else if (typeof position.y === 'number' || (typeof position.y === 'string' && !isNaN(parseFloat(position.y)))) {
      // Fixed pixel positioning: 1200 -> '1200'
      y = position.y.toString();
    } else {
      // Fallback to center
      y = '(h-text_h)/2';
    }
    //✔︎ node ./src/add-text-to-video.js ./video/b-roll/C0006_9-16.MP4 ./output/only-text.mp4
    
    return `${x}:${y}`;
  }

  const positions: { [key: string]: string } = {
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

  return positions[position as string] || positions['center'];
}

function buildTextFilter(overlay: TextOverlay, videoHeight: number): string {
  // Escape text for FFmpeg
  const escapedText = overlay.text.replace(/'/g, "\\'").replace(/:/g, "\\:");
  
  // Calculate responsive font size
  const actualFontSize = calculateFontSize(overlay.fontSize, videoHeight);
  
  // Build drawtext filter
  let drawtext = `drawtext=text='${escapedText}'`;
  drawtext += `:fontfile='${overlay.fontPath!.replace(/\\/g, '/')}'`;
  drawtext += `:fontsize=${actualFontSize}`;
  drawtext += `:fontcolor=${overlay.fontColor}`;
  
  // Position with text alignment
  const coordinates = getPositionCoordinates(overlay.position, 1920, videoHeight, overlay.textAlign);
  drawtext += `:x=${coordinates.split(':')[0]}:y=${coordinates.split(':')[1]}`;
  
  // Text outline
  if (overlay.textOutline && overlay.textOutline.enabled) {
    drawtext += `:borderw=${overlay.textOutline.width}:bordercolor=${overlay.textOutline.color}`;
  }
  
  // Text shadow
  if (overlay.textShadow && overlay.textShadow.enabled) {
    drawtext += `:shadowx=${overlay.textShadow.offsetX}:shadowy=${overlay.textShadow.offsetY}:shadowcolor=${overlay.textShadow.color}`;
  }
  
  // Background box
  if (overlay.textBox && overlay.textBox.enabled) {
    drawtext += `:box=1:boxcolor=${overlay.textBox.color}:boxborderw=${overlay.textBox.padding}`;
  }
  
  // Timing - always apply start and end time
  if (overlay.animation && overlay.animation.enabled && overlay.animation.type === 'fade') {
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
  } else if (overlay.animation && overlay.animation.enabled && overlay.animation.type === 'slide-in') {
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

function buildFFmpegCommand(inputFile: string, outputFile: string, validatedOverlays: TextOverlay[], videoHeight: number): string[] {
  const args = ['-i', inputFile];
  
  // Build text filters for all overlays
  const textFilters = validatedOverlays.map(overlay => buildTextFilter(overlay, videoHeight));
  
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

function runFFmpeg(args: string[]): Promise<void> {
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
    
    ffmpeg.on('error', (err: any) => {
      if (err.code === 'ENOENT') {
        reject(new Error('FFmpeg not found. Please install FFmpeg and make sure it\'s in your PATH.'));
      } else {
        reject(err);
      }
    });
  });
}

function displayConfig(inputFile: string, outputFile: string, validatedOverlays: TextOverlay[], videoDimensions: VideoDimensions): void {
  console.log('Multi-Text Overlay Configuration:');
  console.log(`  Video resolution: ${videoDimensions.width}×${videoDimensions.height}`);
  console.log(`  Total overlays: ${validatedOverlays.length}`);
  console.log('');
  
  // Group overlays by their original text for better display
  const groupedOverlays: { [key: string]: { counter: number; overlays: TextOverlay[]; isTextElements: boolean } } = {};
  let overlayCounter = 1;
  
  validatedOverlays.forEach((overlay) => {
    if (overlay._isMultiLine || overlay._isTextElement) {
      // Multi-line text or text elements
      const originalText = overlay._originalText!;
      if (!groupedOverlays[originalText]) {
        groupedOverlays[originalText] = {
          counter: overlayCounter++,
          overlays: [],
          isTextElements: overlay._isTextElement || false
        };
      }
      groupedOverlays[originalText].overlays.push(overlay);
    } else {
      // Single line text
      groupedOverlays[overlay.text] = {
        counter: overlayCounter++,
        overlays: [overlay],
        isTextElements: false
      };
    }
  });
  
  Object.entries(groupedOverlays).forEach(([originalText, group]) => {
    const firstOverlay = group.overlays[0];
    
    console.log(`  Text ${group.counter}:`);
    
    if (group.isTextElements) {
      console.log(`    Text:        "${originalText}" (${group.overlays.length} text elements)`);
      group.overlays.forEach((overlay, index) => {
        const timing = overlay.startTime !== firstOverlay.startTime || overlay.endTime !== firstOverlay.endTime 
          ? ` (${overlay.startTime}s-${overlay.endTime}s)` 
          : '';
        console.log(`      Element ${index + 1}: "${overlay.text}" on line ${overlay._lineIndex}${timing}`);
      });
    } else if (firstOverlay._isMultiLine) {
      console.log(`    Text:        "${originalText}" (${group.overlays.length} lines)`);
      group.overlays.forEach((overlay, index) => {
        console.log(`      Line ${index + 1}:   "${overlay.text}"`);
      });
    } else {
      console.log(`    Text:        "${originalText}"`);
    }
    
    console.log(`    Timing:      ${firstOverlay.startTime}s - ${firstOverlay.endTime}s`);
    console.log(`    Font:        ${firstOverlay.fontFamily}`);
    
    // Display font size with calculation preview
    const actualFontSize = firstOverlay.fontSize <= 20 
      ? Math.round((firstOverlay.fontSize / 100) * videoDimensions.height)
      : firstOverlay.fontSize;
    
    if (firstOverlay.fontSize <= 20) {
      console.log(`    Font Size:   ${firstOverlay.fontSize}% of video height → ${actualFontSize}px`);
    } else {
      console.log(`    Font Size:   ${firstOverlay.fontSize}px (fixed)`);
    }
    
    console.log(`    Text Align:  ${firstOverlay.textAlign || 'center'}`);
    console.log(`    Color:       ${firstOverlay.fontColor}`);
    
    // Display position - show original for multi-line, actual for single line
    let positionDisplay;
    if (group.isTextElements || firstOverlay._isMultiLine) {
      // Show the original intended position
      const originalPosition = CONFIG.textOverlays.find(o => o.text === originalText)?.position;
      if (typeof originalPosition === 'object') {
        positionDisplay = `x: ${originalPosition.x}, y: ${originalPosition.y} (auto-positioned)`;
      } else {
        positionDisplay = `${originalPosition} (auto-positioned)`;
      }
    } else {
      if (typeof firstOverlay.position === 'object') {
        positionDisplay = `x: ${firstOverlay.position.x}, y: ${firstOverlay.position.y}`;
      } else {
        positionDisplay = firstOverlay.position;
      }
    }
    console.log(`    Position:    ${positionDisplay}`);
    
    console.log(`    Outline:     ${firstOverlay.textOutline.enabled ? `${firstOverlay.textOutline.color} (${firstOverlay.textOutline.width}px)` : 'Disabled'}`);
    console.log(`    Shadow:      ${firstOverlay.textShadow.enabled ? `${firstOverlay.textShadow.color} (${firstOverlay.textShadow.offsetX}, ${firstOverlay.textShadow.offsetY})` : 'Disabled'}`);
    console.log(`    Background:  ${firstOverlay.textBox.enabled ? firstOverlay.textBox.color : 'Disabled'}`);
    console.log(`    Animation:   ${firstOverlay.animation.enabled ? firstOverlay.animation.type : 'Disabled'}`);
    console.log('');
  });
  
  console.log(`Input:  ${inputFile}`);
  console.log(`Output: ${outputFile}`);
  console.log('');
}

async function main(): Promise<void> {
  try {
    const { inputFile, outputFile } = parseArguments();
    
    // Get video dimensions for responsive font sizing
    console.log('Analyzing video dimensions...');
    const videoDimensions = await getVideoDimensions(inputFile);
    console.log('');
    
    // Validate config with video height for multi-line processing
    const validatedOverlays = validateConfig(videoDimensions.height);
    
    if (validatedOverlays.length === 0) {
      console.error('Error: No text overlays configured in CONFIG.textOverlays');
      process.exit(1);
    }
    
    displayConfig(inputFile, outputFile, validatedOverlays, videoDimensions);
    
    const ffmpegArgs = buildFFmpegCommand(inputFile, outputFile, validatedOverlays, videoDimensions.height);
    
    await runFFmpeg(ffmpegArgs);
    
    console.log('');
    console.log(`✅ Multi-text overlay completed successfully!`);
    console.log(`Output file: ${outputFile}`);
    
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Check if FFmpeg is available
function checkFFmpeg(): Promise<boolean> {
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