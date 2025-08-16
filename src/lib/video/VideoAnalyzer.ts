import { spawn } from 'child_process';
import { VideoDimensions } from '../types';

export class VideoAnalyzer {
  static async getDimensions(inputFile: string): Promise<VideoDimensions> {
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
}
