import { spawn } from 'child_process';

export async function run(args: string[]): Promise<void> {
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
