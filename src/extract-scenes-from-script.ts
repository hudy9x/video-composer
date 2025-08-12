import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuration - customize these variables
const CONFIG = {
  // Available scene types (keep it simple and limited)
  SCENE_TYPES: ['b-roll', 'a-roll', 'medium-shot', 'close-shot', 'wide-shot'],
  
  // Content analysis rules (customize these)
  CONTENT_RULES: {
    // Keywords that suggest specific shot types
    CLOSE_SHOT_KEYWORDS: ['personal', 'hello', 'hi', 'I am', "I'm", 'my name', 'see you', 'goodbye'],
    MEDIUM_SHOT_KEYWORDS: ['explain', 'update', 'today', 'worked on', 'fixed', 'wrote code', 'implemented'],
    WIDE_SHOT_KEYWORDS: ['overview', 'big picture', 'entire', 'whole', 'complete'],
    B_ROLL_KEYWORDS: ['repository', 'browser', 'storage', 'page', 'dropdown', 'selection'],
    A_ROLL_KEYWORDS: ['speaking', 'talking', 'update', 'report'],
    
    // Timing rules
    SHORT_DURATION_THRESHOLD: 2, // seconds - prefer close-shots for very short segments
    LONG_DURATION_THRESHOLD: 8,  // seconds - prefer wide-shots for longer segments
  },
  
  // AI behavior customization
  AI_INSTRUCTIONS: {
    TONE: 'professional filmmaker and content creator',
    CONTEXT: 'developer update videos and technical content',
    VARIETY: 'ensure good variety of shots, avoid repetition',
  }
};

interface VTTSegment {
  startTime: number;
  endTime: number;
  duration: number;
  text: string;
}

interface Scene {
  scene: string;
  time: string;
  video: string;
}

class VTTSceneGenerator {
  private genAI: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // Parse WebVTT file
  parseVTT(vttContent: string): VTTSegment[] {
    const segments: VTTSegment[] = [];
    const lines = vttContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for timestamp line (format: 00:00.000 --> 00:03.000)
      const timestampMatch = line.match(/(\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}\.\d{3})/);
      
      if (timestampMatch) {
        const startTime = this.parseTimestamp(timestampMatch[1]);
        const endTime = this.parseTimestamp(timestampMatch[2]);
        const duration = endTime - startTime;
        
        // Get the text from the next non-empty line
        let text = '';
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim() && !lines[j].includes('-->')) {
            text = lines[j].trim();
            break;
          }
        }
        
        segments.push({
          startTime,
          endTime,
          duration,
          text
        });
      }
    }
    
    return segments;
  }

  // Convert timestamp string to seconds
  private parseTimestamp(timestamp: string): number {
    const [minutes, seconds] = timestamp.split(':');
    return parseInt(minutes) * 60 + parseFloat(seconds);
  }

  // Format duration to string with 's' suffix
  private formatDuration(seconds: number): string {
    return `${Math.round(seconds)}s`;
  }

  // Generate AI prompt for scene analysis
  private generatePrompt(segments: VTTSegment[]): string {
    const sceneTypes = CONFIG.SCENE_TYPES.join(', ');
    const context = CONFIG.AI_INSTRUCTIONS.CONTEXT;
    const tone = CONFIG.AI_INSTRUCTIONS.TONE;
    const variety = CONFIG.AI_INSTRUCTIONS.VARIETY;

    return `You are a ${tone} specializing in ${context}.

Your task is to analyze a script and suggest appropriate camera shots for each segment.

Available shot types: ${sceneTypes}

Shot type guidelines:
- b-roll: Background footage, supporting visuals, screen recordings, technical demonstrations
- a-roll: Main speaking footage, presenter talking directly to camera
- close-shot: Intimate moments, personal introductions, emotional emphasis
- medium-shot: Standard talking head, explanations, main content delivery
- wide-shot: Overview shots, context setting, longer segments

Consider these factors:
- Content type and mood of each segment
- Duration of each segment (shorter = closer shots, longer = wider shots)
- ${variety}
- Technical content vs personal content

Script segments:
${segments.map((seg, index) => 
  `Segment ${index + 1}: Duration ${this.formatDuration(seg.duration)} - "${seg.text}"`
).join('\n')}

Respond with ONLY a JSON array in this exact format:
[
  {
    "scene": "shot-type",
    "time": "duration-in-seconds-with-s-suffix",
    "video": "C0001"
  }
]

Make sure:
1. Each segment gets exactly one scene entry
2. The time matches the segment duration exactly
3. Video names follow the C0001, C0002, etc. format
4. Use only the provided shot types
5. Ensure good variety and avoid repetitive patterns`;
  }

  // Call Gemini API to analyze segments
  async analyzeWithAI(segments: VTTSegment[]): Promise<Scene[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
      const prompt = this.generatePrompt(segments);
      
      console.log('Analyzing script with AI...');
      console.log('Prompt:', prompt);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('AI Response:', text);
      
      // Parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const scenes: Scene[] = JSON.parse(jsonMatch[0]);
      
      // Validate and correct the response
      return this.validateScenes(scenes, segments);
      
    } catch (error) {
      console.error('Error calling AI:', error);
      throw error;
    }
  }

  // Validate and correct AI response
  private validateScenes(scenes: Scene[], segments: VTTSegment[]): Scene[] {
    const validatedScenes: Scene[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const scene = scenes[i] || {};
      
      // Ensure scene type is valid
      const sceneType = CONFIG.SCENE_TYPES.includes(scene.scene) 
        ? scene.scene 
        : this.suggestSceneType(segment);
      
      // Ensure time matches segment duration
      const time = this.formatDuration(segment.duration);
      
      // Ensure video name follows correct format
      const video = `C${String(i + 1).padStart(4, '0')}`;
      
      validatedScenes.push({
        scene: sceneType,
        time: time,
        video: video
      });
    }
    
    return validatedScenes;
  }

  // Fallback scene type suggestion based on content rules
  private suggestSceneType(segment: VTTSegment): string {
    const text = segment.text.toLowerCase();
    const rules = CONFIG.CONTENT_RULES;
    
    // Check duration-based rules
    if (segment.duration <= rules.SHORT_DURATION_THRESHOLD) {
      return 'close-shot';
    }
    if (segment.duration >= rules.LONG_DURATION_THRESHOLD) {
      return 'wide-shot';
    }
    
    // Check content-based rules
    if (rules.CLOSE_SHOT_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))) {
      return 'close-shot';
    }
    if (rules.B_ROLL_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))) {
      return 'b-roll';
    }
    if (rules.MEDIUM_SHOT_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))) {
      return 'medium-shot';
    }
    if (rules.WIDE_SHOT_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))) {
      return 'wide-shot';
    }
    
    // Default fallback
    return 'medium-shot';
  }

  // Main processing function
  async processVTTFile(vttFilePath: string): Promise<Scene[]> {
    try {
      // Read VTT file
      const vttContent = fs.readFileSync(vttFilePath, 'utf-8');
      console.log('VTT file loaded successfully');
      
      // Parse VTT segments
      const segments = this.parseVTT(vttContent);
      console.log(`Parsed ${segments.length} segments`);
      
      if (segments.length === 0) {
        throw new Error('No segments found in VTT file');
      }
      
      // Analyze with AI
      const scenes = await this.analyzeWithAI(segments);
      console.log('Scene analysis complete');
      
      return scenes;
      
    } catch (error) {
      console.error('Error processing VTT file:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: node script.js <vtt-file-path>');
    console.error('Make sure to set GEMINI_API_KEY environment variable');
    process.exit(1);
  }
  
  const vttFilePath = args[0];
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY environment variable not set');
    process.exit(1);
  }
  
  if (!fs.existsSync(vttFilePath)) {
    console.error(`Error: VTT file not found: ${vttFilePath}`);
    process.exit(1);
  }
  
  try {
    const generator = new VTTSceneGenerator(apiKey);
    const scenes = await generator.processVTTFile(vttFilePath);
    
    // Output the result
    console.log('\n=== Generated Scenes ===');
    console.log('const scenes = ');
    console.log(JSON.stringify(scenes, null, 2));
    console.log(';');
    
    // Optionally save to file
    const outputPath = `scene_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(path.join(__dirname, '../output', outputPath), JSON.stringify(scenes, null, 2));
    console.log(`\nScenes saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('Failed to generate scenes:', error);
    process.exit(1);
  }
}

// Export for use as module
export { VTTSceneGenerator, CONFIG };

// Run if called directly
if (require.main === module) {
  main();
}