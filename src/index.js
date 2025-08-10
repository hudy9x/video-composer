const { composeVideo } = require('./video-composer');
const { speechToText } = require('./speech-to-text');
const { composeVideoWithSubtitles, setSubtitleStyle, addSubtitlesToVideo } = require('./subtitle-video-composer');
const path = require('path');

// Formats a timestamp in GMT+7 (Asia/Bangkok) suitable for filenames
function generateTimestampInGmtPlus7() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(now).map(part => [part.type, part.value])
  );

  // Use dashes instead of colons to keep filename cross-platform friendly
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}-${parts.minute}-${parts.second}+07`;
}

// ===== CONFIGURATION =====
const CONFIG = {
  // Audio file path (change this to your audio file)
  audioPath: path.join(__dirname, '../audio/hudy-style-40.mp3'),

  // Final output filename
  finalOutputName: `final_video_${generateTimestampInGmtPlus7()}.mp4`,

  // Subtitle position: 'top', 'center', 'bottom'
  subtitlePosition: 'center',

  // Enable/disable features
  enableSubtitles: true,
  enableAudio: true,

  // If you already have transcription, set this path (optional)
  existingTranscriptionPath: null // e.g., './transcription.json'
};

const scenes = [
  {
    "scene": "b-roll",
    "time": "4s",
    "video": "C0006"
  },
  {
    "scene": "b-roll",
    "time": "3s",
    "video": "C0014"
  },
  {
    "scene": "close-shot",
    "time": "4s",
    "video": "C0004"
  },
  {
    "scene": "close-shot",
    "time": "3s",
    "video": "C0005"
  },
  {
    "scene": "medium-shot",
    "time": "4s",
    "video": "C0053"
  },
  {
    "scene": "medium-shot",
    "time": "3s",
    "video": "C0061"
  },
  {
    "scene": "pov",
    "time": "4s",
    "video": "C0066"
  },
  {
    "scene": "wide-shot",
    "time": "4s",
    "video": "C0283"
  },
  {
    "scene": "wide-shot",
    "time": "3s",
    "video": "C0288"
  }
];

// ===== UTILITY FUNCTIONS =====
async function loadExistingTranscription(path) {
  try {
    const fs = require('fs').promises;
    const content = await fs.readFile(path, 'utf8');
    const transcription = JSON.parse(content);
    console.log(`✅ Loaded existing transcription: ${transcription.length} segments`);
    return transcription;
  } catch (error) {
    console.warn(`⚠ Could not load transcription from ${path}: ${error.message}`);
    return null;
  }
}

function setupSubtitleStyle() {
  // Customize subtitle appearance
  setSubtitleStyle({
    fontSize: 50,
    fontFamily: 'Monaco',
    fontColor: 'white',
    outlineColor: 'black',
    outlineWidth: 2,
    position: CONFIG.subtitlePosition,
    marginBottom: 60,
    marginTop: 60
  });
}

// ===== MAIN WORKFLOW =====
async function main() {
  try {
    console.log('🎬 Starting video composition workflow...\n');

    // Setup subtitle styling
    setupSubtitleStyle();

    let transcription = null;

    // Step 1: Get transcription (either load existing or create new)
    if (CONFIG.enableSubtitles) {
      if (CONFIG.existingTranscriptionPath) {
        console.log('📄 Loading existing transcription...');
        transcription = await loadExistingTranscription(CONFIG.existingTranscriptionPath);
      }

      if (!transcription && CONFIG.audioPath) {
        console.log('🎤 Converting speech to text...');
        try {
          transcription = await speechToText(CONFIG.audioPath);
        } catch (error) {
          console.warn(`⚠ Speech-to-text failed: ${error.message}`);
          console.log('📹 Continuing without subtitles...');
          CONFIG.enableSubtitles = false;
        }
      }
    }

    // Step 2: Compose final video with all features
    if (CONFIG.enableSubtitles && CONFIG.enableAudio && transcription) {
      console.log('\n🎯 Creating video with scenes + audio + subtitles...');
      const finalVideo = await composeVideoWithSubtitles(
        scenes,
        CONFIG.audioPath,
        transcription,
        CONFIG.finalOutputName,
        CONFIG.subtitlePosition
      );
      console.log(`\n🎉 Complete video ready: ${finalVideo}`);

    } else if (CONFIG.enableAudio && !CONFIG.enableSubtitles) {
      console.log('\n🎯 Creating video with scenes + audio (no subtitles)...');

      // First compose video from scenes
      const tempVideoName = 'temp_composed_video.mp4';
      console.log('Step 1: Composing video from scenes...');
      const composedVideo = await composeVideo(scenes, tempVideoName);

      // Then add audio
      console.log('Step 2: Adding audio to video...');
      const finalVideo = await addSubtitlesToVideo(
        composedVideo,
        CONFIG.audioPath,
        [], // Empty subtitles array
        CONFIG.finalOutputName,
        CONFIG.subtitlePosition
      );

      console.log(`\n🎉 Video with audio ready: ${finalVideo}`);

    } else {
      console.log('\n🎯 Creating video from scenes only (no audio, no subtitles)...');
      const finalVideo = await composeVideo(scenes, CONFIG.finalOutputName);
      console.log(`\n🎉 Basic video ready: ${finalVideo}`);
    }

    console.log('\n✅ Workflow completed successfully!');

  } catch (error) {
    console.error(`\n❌ Workflow failed: ${error.message}`);
    process.exit(1);
  }
}

// ===== ALTERNATIVE FUNCTIONS FOR STEP-BY-STEP CONTROL =====

// If you want to run steps separately:
async function stepByStep() {
  try {
    console.log('🎬 Running step-by-step workflow...\n');

    // Step 1: Create basic video
    console.log('Step 1: Creating video from scenes...');
    const basicVideo = await composeVideo(scenes, 'basic_video.mp4');
    console.log(`✅ Basic video: ${basicVideo}\n`);

    // Step 2: Convert audio to text (if needed)
    let transcription = null;
    if (CONFIG.enableSubtitles && CONFIG.audioPath) {
      console.log('Step 2: Converting speech to text...');
      transcription = await speechToText(CONFIG.audioPath, 'transcription.json');
      console.log(`✅ Transcription: ${transcription.length} segments\n`);
    }

    // Step 3: Add audio and subtitles
    if (CONFIG.enableAudio || CONFIG.enableSubtitles) {
      console.log('Step 3: Adding audio and subtitles...');
      setupSubtitleStyle();

      const finalVideo = await addSubtitlesToVideo(
        basicVideo,
        CONFIG.audioPath,
        transcription || [],
        'final_step_by_step.mp4',
        CONFIG.subtitlePosition
      );
      console.log(`✅ Final video: ${finalVideo}\n`);
    }

    console.log('🎉 Step-by-step workflow completed!');

  } catch (error) {
    console.error(`❌ Step-by-step workflow failed: ${error.message}`);
    process.exit(1);
  }
}

// ===== QUICK SETUP EXAMPLES =====

// Example 1: Full workflow with everything
async function fullWorkflow() {
  CONFIG.audioPath = './audio/sample.mp3';
  CONFIG.enableSubtitles = true;
  CONFIG.enableAudio = true;
  CONFIG.subtitlePosition = 'bottom';
  await main();
}

// Example 2: Just video + audio (no subtitles)
async function videoWithAudio() {
  CONFIG.audioPath = './audio/sample.mp3';
  CONFIG.enableSubtitles = false;
  CONFIG.enableAudio = true;
  await main();
}

// Example 3: Just basic video (no audio, no subtitles)
async function basicVideoOnly() {
  CONFIG.enableSubtitles = false;
  CONFIG.enableAudio = false;
  await main();
}

// ===== EXPORTS FOR EXTERNAL USE =====
module.exports = {
  main,
  stepByStep,
  fullWorkflow,
  videoWithAudio,
  basicVideoOnly,
  scenes,
  CONFIG
};

// ===== RUN THE MAIN WORKFLOW =====
if (require.main === module) {
  main();
}
