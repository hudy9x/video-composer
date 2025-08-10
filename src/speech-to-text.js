const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// ===== CONFIGURATION =====
const CONFIG = {
  tempDir: path.join(__dirname, '../temp'),
  outputDir: path.join(__dirname, '../output'),
  // Whisper model sizes: tiny, base, small, medium, large
  whisperModel: 'base',
  // Language (auto-detect if null)
  language: null,
  // Max segment length in seconds for splitting
  maxSegmentLength: 1.5, // Reduced from 6 to 1.5 seconds
  // Word-level splitting options
  maxWordsPerSegment: 4, // Maximum words per segment
  enableWordTimestamps: true
};

// ===== UTILITY FUNCTIONS =====
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, options);
    let stdout = '';
    let stderr = '';
    
    if (process.stdout) {
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }
    
    if (process.stderr) {
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${command} failed with code ${code}: ${stderr}`));
      }
    });
    
    process.on('error', (err) => {
      reject(new Error(`Failed to start ${command}: ${err.message}`));
    });
  });
}

function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function timeToSeconds(timeString) {
  // Convert MM:SS.mmm to seconds
  const parts = timeString.split(':');
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return parseInt(minutes) * 60 + parseFloat(seconds);
  } else if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
  }
  return parseFloat(timeString);
}

function secondsToTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return `${minutes.toString().padStart(2, '0')}:${secs.padStart(5, '0')}`;
}

// Split segments by time duration
function splitSegmentsByTime(segments, maxDuration = CONFIG.maxSegmentLength) {
  const result = [];
  
  for (const segment of segments) {
    const [startTime, endTime] = segment.time.split('-');
    const startSeconds = timeToSeconds(startTime);
    const endSeconds = timeToSeconds(endTime);
    const duration = endSeconds - startSeconds;
    
    if (duration <= maxDuration) {
      result.push(segment);
      continue;
    }
    
    // Split long segment
    const words = segment.text.split(' ');
    const wordsPerSecond = words.length / duration;
    const targetSegments = Math.ceil(duration / maxDuration);
    const wordsPerSegment = Math.ceil(words.length / targetSegments);
    
    for (let i = 0; i < targetSegments; i++) {
      const segmentWords = words.slice(i * wordsPerSegment, (i + 1) * wordsPerSegment);
      if (segmentWords.length === 0) continue;
      
      const segmentStartTime = startSeconds + (i * duration / targetSegments);
      const segmentEndTime = Math.min(startSeconds + ((i + 1) * duration / targetSegments), endSeconds);
      
      result.push({
        text: segmentWords.join(' '),
        time: `${secondsToTime(segmentStartTime)}-${secondsToTime(segmentEndTime)}`
      });
    }
  }
  
  return result;
}

// Split segments by word count
function splitSegmentsByWords(segments, maxWords = CONFIG.maxWordsPerSegment) {
  const result = [];
  
  for (const segment of segments) {
    const words = segment.text.split(' ');
    const [startTime, endTime] = segment.time.split('-');
    const startSeconds = timeToSeconds(startTime);
    const endSeconds = timeToSeconds(endTime);
    const duration = endSeconds - startSeconds;
    
    if (words.length <= maxWords) {
      result.push(segment);
      continue;
    }
    
    // Split by word count
    const segmentCount = Math.ceil(words.length / maxWords);
    const timePerSegment = duration / segmentCount;
    
    for (let i = 0; i < segmentCount; i++) {
      const segmentWords = words.slice(i * maxWords, (i + 1) * maxWords);
      if (segmentWords.length === 0) continue;
      
      const segmentStartTime = startSeconds + (i * timePerSegment);
      const segmentEndTime = Math.min(startSeconds + ((i + 1) * timePerSegment), endSeconds);
      
      result.push({
        text: segmentWords.join(' '),
        time: `${secondsToTime(segmentStartTime)}-${secondsToTime(segmentEndTime)}`
      });
    }
  }
  
  return result;
}

// Advanced splitting using Whisper's word-level timestamps
async function transcribeWithWordTimestamps(audioPath) {
  console.log('🎤 Transcribing with word-level timestamps...');
  
  const args = [
    audioPath,
    '--model', CONFIG.whisperModel,
    '--output_dir', CONFIG.tempDir,
    '--output_format', 'json', // Use JSON for word timestamps
    '--word_timestamps', 'True',
    '--verbose', 'False'
  ];
  
  if (CONFIG.language) {
    args.push('--language', CONFIG.language);
  }
  
  try {
    await runCommand('whisper', args);
    
    // Find the generated JSON file
    const baseFilename = path.parse(audioPath).name;
    const jsonPath = path.join(CONFIG.tempDir, `${baseFilename}.json`);
    
    const jsonContent = await fs.readFile(jsonPath, 'utf8');
    const whisperData = JSON.parse(jsonContent);
    
    return whisperData;
  } catch (error) {
    console.warn('Word-level timestamps failed, falling back to regular transcription');
    return null;
  }
}

function createSegmentsFromWordTimestamps(whisperData, maxDuration = CONFIG.maxSegmentLength) {
  if (!whisperData || !whisperData.segments) {
    return null;
  }
  
  const result = [];
  
  for (const segment of whisperData.segments) {
    if (!segment.words || segment.words.length === 0) {
      // Fallback to segment-level timing
      result.push({
        text: segment.text.trim(),
        time: `${secondsToTime(segment.start)}-${secondsToTime(segment.end)}`
      });
      continue;
    }
    
    // Create segments using word-level timestamps
    let currentSegment = {
      words: [],
      start: segment.words[0].start,
      end: segment.words[0].end
    };
    
    for (const word of segment.words) {
      // Check if adding this word would exceed maxDuration or maxWords
      const potentialEnd = word.end;
      const potentialDuration = potentialEnd - currentSegment.start;
      
      if ((potentialDuration > maxDuration || currentSegment.words.length >= CONFIG.maxWordsPerSegment) 
          && currentSegment.words.length > 0) {
        // Finalize current segment
        result.push({
          text: currentSegment.words.map(w => w.word).join('').trim(),
          time: `${secondsToTime(currentSegment.start)}-${secondsToTime(currentSegment.end)}`
        });
        
        // Start new segment
        currentSegment = {
          words: [word],
          start: word.start,
          end: word.end
        };
      } else {
        // Add word to current segment
        currentSegment.words.push(word);
        currentSegment.end = word.end;
      }
    }
    
    // Add final segment if it has words
    if (currentSegment.words.length > 0) {
      result.push({
        text: currentSegment.words.map(w => w.word).join('').trim(),
        time: `${secondsToTime(currentSegment.start)}-${secondsToTime(currentSegment.end)}`
      });
    }
  }
  
  return result;
}

function parseWhisperOutput(whisperText) {
  // Parse Whisper's VTT-like output format
  const segments = [];
  const lines = whisperText.split(/\r?\n/).filter(Boolean);
  let currentSegment = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and headers
    if (!trimmedLine || trimmedLine.startsWith('WEBVTT') || trimmedLine.startsWith('NOTE')) {
      continue;
    }
    
    // Check if line contains timestamp
    const timestampMatch = trimmedLine.match(/(?<start>(\d{2}:)?\d{2}:\d{2}\.\d{3})(\s*-->\s*)(?<end>(\d{2}:)?\d{2}:\d{2}\.\d{3})/);
    
    if (timestampMatch) {
      const {groups} = timestampMatch;
      const {start:startTime, end:endTime} = groups;
      currentSegment = {
        startTime,
        endTime,
        text: ''
      };
    } else if (currentSegment && trimmedLine) {
      // This is text content
      currentSegment.text = trimmedLine;
      
      // Convert to desired format
      const formattedSegment = {
        text: currentSegment.text,
        time: `${currentSegment.startTime.substring(0, 8)}-${currentSegment.endTime.substring(0, 8)}`
      };
      
      segments.push(formattedSegment);
      currentSegment = null;
    }
  }
  
  return segments;
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

async function convertToWav(inputPath) {
  console.log('🔄 Converting audio to WAV format...');
  
  const wavPath = path.join(CONFIG.tempDir, `audio_${uuidv4()}.wav`);
  
  const args = [
    '-i', inputPath,
    '-acodec', 'pcm_s16le',
    '-ar', '16000',
    '-ac', '1',
    '-y',
    wavPath
  ];
  
  await runCommand('ffmpeg', args);
  console.log('✓ Audio converted to WAV');
  return wavPath;
}

async function transcribeWithWhisper(audioPath) {
  console.log('🎤 Transcribing audio with Whisper...');
  
  const args = [
    audioPath,
    '--model', CONFIG.whisperModel,
    '--output_dir', CONFIG.tempDir,
    '--output_format', 'vtt',
    '--verbose', 'False'
  ];
  
  if (CONFIG.language) {
    args.push('--language', CONFIG.language);
  }
  
  try {
    await runCommand('whisper', args);
    
    const baseFilename = path.parse(audioPath).name;
    const vttPath = path.join(CONFIG.tempDir, `${baseFilename}.vtt`);
    
    const vttContent = await fs.readFile(vttPath, 'utf8');
    console.log('✓ Transcription completed');
    
    return vttContent;
  } catch (error) {
    throw new Error(`Whisper transcription failed: ${error.message}`);
  }
}

async function speechToText(mp3Path, outputJsonPath = null, splitMethod = 'time') {
  console.log(`\n🎵 Starting speech-to-text conversion: ${mp3Path}`);
  console.log(`📏 Split method: ${splitMethod}, Max duration: ${CONFIG.maxSegmentLength}s, Max words: ${CONFIG.maxWordsPerSegment}`);
  
  await ensureDirectories();
  
  let wavPath = null;
  
  try {
    await fs.access(mp3Path);
    wavPath = await convertToWav(mp3Path);
    
    let segments = [];
    
    // Try word-level timestamps first if enabled
    if (CONFIG.enableWordTimestamps && splitMethod === 'word-timestamps') {
      console.log('🔍 Attempting word-level timestamp extraction...');
      const whisperData = await transcribeWithWordTimestamps(wavPath);
      
      if (whisperData) {
        segments = createSegmentsFromWordTimestamps(whisperData);
        console.log('✓ Using word-level timestamps');
      }
    }
    
    // Fallback to VTT parsing if word timestamps failed
    if (segments.length === 0) {
      console.log('📝 Using VTT parsing method...');
      const whisperOutput = await transcribeWithWhisper(wavPath);
      segments = parseWhisperOutput(whisperOutput);
      
      // Apply splitting method
      switch (splitMethod) {
        case 'time':
          segments = splitSegmentsByTime(segments);
          break;
        case 'words':
          segments = splitSegmentsByWords(segments);
          break;
        case 'both':
          segments = splitSegmentsByTime(segments);
          segments = splitSegmentsByWords(segments);
          break;
      }
    }
    
    console.log(`\n📝 Transcription Results (${segments.length} segments):`);
    console.log('='.repeat(50));
    segments.forEach((segment, index) => {
      const [startTime, endTime] = segment.time.split('-');
      const duration = (timeToSeconds(endTime) - timeToSeconds(startTime)).toFixed(2);
      console.log(`${index + 1}. [${segment.time}] (${duration}s) "${segment.text}"`);
    });
    
    // Save to JSON file
    if (outputJsonPath || segments.length > 0) {
      const finalOutputPath = outputJsonPath || path.join(CONFIG.outputDir, 'transcription.json');
      await fs.writeFile(finalOutputPath, JSON.stringify(segments, null, 2));
      console.log(`\n💾 Transcription saved to: ${finalOutputPath}`);
    }
    
    return segments;
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    throw error;
  } finally {
    if (wavPath) {
      try {
        await fs.unlink(wavPath);
        console.log('✓ Temporary files cleaned up');
      } catch (cleanupError) {
        console.warn('⚠ Failed to cleanup temporary file');
      }
    }
  }
}

// ===== EXPORTS =====
module.exports = {
  speechToText,
  CONFIG
};

// Run if this file is executed directly
if (require.main === module) {
  const mp3Path = process.argv[2];
  const splitMethod = process.argv[3] || 'time'; // 'time', 'words', 'both', or 'word-timestamps'
  
  if (mp3Path) {
    console.log(`Using split method: ${splitMethod}`);
    speechToText(mp3Path, null, splitMethod).catch(console.error);
  } else {
    console.log('Usage: node speech-to-text.js <path-to-mp3-file> [split-method]');
    console.log('Split methods:');
    console.log('  time - Split by duration (default)');
    console.log('  words - Split by word count');  
    console.log('  both - Apply both time and word splitting');
    console.log('  word-timestamps - Use Whisper word-level timestamps (best quality)');
    console.log('');
    console.log('Example: node speech-to-text.js ./audio/sample.mp3 word-timestamps');
  }
}