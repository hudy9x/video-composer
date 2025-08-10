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
  // Max segment length in seconds
  maxSegmentLength: 6
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

function parseWhisperOutput(whisperText) {
  // Parse Whisper's VTT-like output format
  const segments = [];
  const lines = whisperText.split(/\r?\n/).filter(Boolean);
  // console.log('parseWhisperOutput. lines => ', lines);
  let currentSegment = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and headers
    if (!trimmedLine || trimmedLine.startsWith('WEBVTT') || trimmedLine.startsWith('NOTE')) {
      continue;
    }
    
    // Check if line contains timestamp (format: 00:00:02.000 --> 00:00:04.000)
    const timestampMatch = trimmedLine.match(/(?<start>(\d{2}:)?\d{2}:\d{2}\.\d{3})(\s*-->\s*)(?<end>(\d{2}:)?\d{2}:\d{2}\.\d{3})/);

    console.log('trimmedLine', trimmedLine)
    console.log('timestampMatch', timestampMatch);
    
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

// ===== MAIN CONVERSION FUNCTIONS =====
async function convertToWav(inputPath) {
  console.log('🔄 Converting audio to WAV format...');
  
  const wavPath = path.join(CONFIG.tempDir, `audio_${uuidv4()}.wav`);
  
  const args = [
    '-i', inputPath,
    '-acodec', 'pcm_s16le',
    '-ar', '16000',  // 16kHz sample rate (Whisper standard)
    '-ac', '1',      // Mono
    '-y',            // Overwrite output
    wavPath
  ];
  
  await runCommand('ffmpeg', args);
  console.log('✓ Audio converted to WAV');
  return wavPath;
}

async function transcribeWithWhisper(audioPath) {
  console.log('🎤 Transcribing audio with Whisper...: => ', audioPath);
  
  const outputPath = path.join(CONFIG.tempDir, `transcript_${uuidv4()}`);
  
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
  
  // Add max segment length
  args.push('--word_timestamps', 'True');
  
  try {
    const result = await runCommand('whisper', args);
    
    // Find the generated VTT file
    const baseFilename = path.parse(audioPath).name;
    const vttPath = path.join(CONFIG.tempDir, `${baseFilename}.vtt`);
    
    const vttContent = await fs.readFile(vttPath, 'utf8');
    console.log('✓ Transcription completed');
    
    return vttContent;
  } catch (error) {
    throw new Error(`Whisper transcription failed: ${error.message}\n\nMake sure you have Whisper installed:\npip install openai-whisper`);
  }
}

async function speechToText(mp3Path, outputJsonPath = null) {
  console.log(`\n🎵 Starting speech-to-text conversion: ${mp3Path}`);
  
  await ensureDirectories();
  
  let wavPath = null;
  
  try {
    // Check if input file exists
    await fs.access(mp3Path);
    
    // Convert to WAV format for Whisper
    wavPath = await convertToWav(mp3Path);
    
    // Transcribe with Whisper
    const whisperOutput = await transcribeWithWhisper(wavPath);

    console.log('whisperOutput', whisperOutput);
    
    // Parse Whisper output to desired format
    const segments = parseWhisperOutput(whisperOutput);
    
    console.log(`\n📝 Transcription Results:`);
    console.log('=' .repeat(50));
    console.log('segments', segments);
    segments.forEach((segment, index) => {
      console.log(`${index + 1}. [${segment.time}] "${segment.text}"`);
    });
    
    // Save to JSON file if specified
    if (outputJsonPath || segments.length > 0) {
      const finalOutputPath = outputJsonPath || path.join(CONFIG.outputDir, 'transcription.json');
      await fs.writeFile(finalOutputPath, JSON.stringify(segments, null, 2));
      console.log(`\n💾 Transcription saved to: ${finalOutputPath}`);
    }
    
    // Print JavaScript array format
    console.log(`\n🔧 JavaScript Array Format:`);
    console.log('=' .repeat(50));
    console.log('const transcription = [');
    segments.forEach((segment, index) => {
      const comma = index < segments.length - 1 ? ',' : '';
      console.log(`  { text: '${segment.text}', time: '${segment.time}' }${comma}`);
    });
    console.log('];');
    
    return segments;
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    throw error;
  } finally {
    // Cleanup temporary WAV file
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

// ===== EXAMPLE USAGE =====
async function main() {
  const mp3Path = './audio/sample.mp3'; // Change this to your MP3 file
  
  try {
    const transcription = await speechToText(mp3Path);
    console.log(`\nTranscription completed! Found ${transcription.length} segments.`);
  } catch (error) {
    console.error('Transcription failed:', error.message);
    process.exit(1);
  }
}

// ===== EXPORTS =====
module.exports = {
  speechToText,
  CONFIG
};

// Run if this file is executed directly
if (require.main === module) {
  // Check if MP3 path provided as argument
  const mp3Path = process.argv[2];
  if (mp3Path) {
    speechToText(mp3Path).catch(console.error);
  } else {
    console.log('Usage: node speech-to-text.js <path-to-mp3-file>');
    console.log('Example: node speech-to-text.js ./audio/sample.mp3');
  }
}
