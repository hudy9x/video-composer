const fs = require('fs').promises;
const path = require('path');

// ===== CONFIGURATION =====
const CONFIG = {
  videoDir: path.join(__dirname, '../video'),
  supportedFormats: ['.mp4', '.avi', '.mov', '.mkv', '.webm'],
  defaultTime: '4s' // Default duration for each video
};

// ===== UTILITY FUNCTIONS =====
function isVideoFile(filename) {
  return CONFIG.supportedFormats.some(ext => 
    filename.toLowerCase().endsWith(ext)
  );
}

function getVideoId(filename) {
  // Remove file extension to get video ID
  return path.parse(filename).name;
}

// ===== CORE SCANNING FUNCTIONS =====
async function scanSceneFolder(scenePath, sceneType) {
  try {
    const files = await fs.readdir(scenePath);
    const videoFiles = files.filter(isVideoFile);
    
    return videoFiles.map(filename => ({
      scene: sceneType,
      time: CONFIG.defaultTime,
      video: getVideoId(filename),
      filename: filename,
      fullPath: path.join(scenePath, filename)
    }));
  } catch (error) {
    console.warn(`⚠ Could not scan scene folder '${sceneType}': ${error.message}`);
    return [];
  }
}

async function scanAllVideos() {
  console.log('🔍 Scanning video folders...\n');
  
  try {
    // Get all scene folders
    const items = await fs.readdir(CONFIG.videoDir);
    const sceneFolders = [];
    
    // Filter only directories
    for (const item of items) {
      const itemPath = path.join(CONFIG.videoDir, item);
      const stat = await fs.stat(itemPath);
      if (stat.isDirectory()) {
        sceneFolders.push(item);
      }
    }
    
    console.log(`Found ${sceneFolders.length} scene folders: ${sceneFolders.join(', ')}\n`);
    
    // Scan each scene folder
    const allVideos = [];
    for (const sceneType of sceneFolders) {
      const scenePath = path.join(CONFIG.videoDir, sceneType);
      const sceneVideos = await scanSceneFolder(scenePath, sceneType);
      
      console.log(`📁 ${sceneType}/`);
      sceneVideos.forEach(video => {
        console.log(`   ✓ ${video.filename} → video: '${video.video}'`);
      });
      console.log();
      
      allVideos.push(...sceneVideos);
    }
    
    return allVideos;
  } catch (error) {
    throw new Error(`Failed to scan video directory: ${error.message}`);
  }
}

// ===== OUTPUT FORMATTERS =====
function generateExampleScenes(allVideos) {
  // Create example scenes array using discovered videos
  const scenesByType = {};
  
  // Group videos by scene type
  allVideos.forEach(video => {
    if (!scenesByType[video.scene]) {
      scenesByType[video.scene] = [];
    }
    scenesByType[video.scene].push(video);
  });
  
  // Generate example scenes (mix different scene types)
  const exampleScenes = [];
  const sceneTypes = Object.keys(scenesByType);
  
  // Add a few examples from each scene type
  sceneTypes.forEach(sceneType => {
    const videos = scenesByType[sceneType];
    // Add first video from each scene type
    if (videos.length > 0) {
      exampleScenes.push({
        scene: sceneType,
        time: CONFIG.defaultTime,
        video: videos[0].video
      });
    }
    // Add second video if available
    if (videos.length > 1) {
      exampleScenes.push({
        scene: sceneType,
        time: '3s',
        video: videos[1].video
      });
    }
  });
  
  return exampleScenes;
}

function formatAsJavaScript(scenes, variableName = 'exampleScenes') {
  const formatted = scenes.map(scene => 
    `    { scene: '${scene.scene}', time: '${scene.time}', video: '${scene.video}' }`
  ).join(',\n');
  
  return `const ${variableName} = [\n${formatted}\n];`;
}

function formatAsJSON(scenes, pretty = true) {
  return pretty ? JSON.stringify(scenes, null, 2) : JSON.stringify(scenes);
}

// ===== SUMMARY FUNCTIONS =====
function printSummary(allVideos) {
  console.log('📊 SUMMARY');
  console.log('=' .repeat(50));
  
  const sceneCount = {};
  allVideos.forEach(video => {
    sceneCount[video.scene] = (sceneCount[video.scene] || 0) + 1;
  });
  
  console.log(`Total videos found: ${allVideos.length}`);
  console.log('Videos per scene:');
  Object.entries(sceneCount).forEach(([scene, count]) => {
    console.log(`  ${scene}: ${count} videos`);
  });
  console.log();
}

function printAllVideos(allVideos) {
  console.log('📋 ALL AVAILABLE VIDEOS');
  console.log('=' .repeat(50));
  
  const scenesByType = {};
  allVideos.forEach(video => {
    if (!scenesByType[video.scene]) {
      scenesByType[video.scene] = [];
    }
    scenesByType[video.scene].push(video);
  });
  
  Object.entries(scenesByType).forEach(([sceneType, videos]) => {
    console.log(`\n${sceneType.toUpperCase()}:`);
    videos.forEach(video => {
      console.log(`  - video: '${video.video}' (${video.filename})`);
    });
  });
  console.log();
}

// ===== MAIN FUNCTION =====
async function main() {
  try {
    const allVideos = await scanAllVideos();
    
    if (allVideos.length === 0) {
      console.log('❌ No videos found in the video folder structure.');
      return;
    }
    
    // Print summary
    printSummary(allVideos);
    
    // Print all available videos
    printAllVideos(allVideos);
    
    // Generate example scenes
    const exampleScenes = generateExampleScenes(allVideos);
    
    // Output formatted JavaScript
    console.log('🎬 EXAMPLE SCENES ARRAY (JavaScript format)');
    console.log('=' .repeat(50));
    console.log(formatAsJavaScript(exampleScenes));
    console.log();
    
    // Output formatted JSON
    console.log('📝 EXAMPLE SCENES ARRAY (JSON format)');
    console.log('=' .repeat(50));
    console.log(formatAsJSON(exampleScenes));
    console.log();
    
    // Save to file
    const outputPath = '../discovered_videos.json';
    await fs.writeFile(outputPath, JSON.stringify({
      allVideos: allVideos,
      exampleScenes: exampleScenes,
      summary: {
        totalVideos: allVideos.length,
        sceneTypes: [...new Set(allVideos.map(v => v.scene))],
        generatedAt: new Date().toISOString()
      }
    }, null, 2));
    
    console.log(`💾 Results saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// ===== EXPORTS =====
module.exports = {
  scanAllVideos,
  generateExampleScenes,
  formatAsJavaScript,
  formatAsJSON,
  CONFIG
};

// Run if this file is executed directly
if (require.main === module) {
  main();
}
