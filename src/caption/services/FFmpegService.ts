import { spawn } from "child_process";

export class FFmpegService {
  static async checkAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const ffmpeg = spawn("ffmpeg", ["-version"]);

      ffmpeg.on("close", (code) => {
        resolve(code === 0);
      });

      ffmpeg.on("error", () => {
        resolve(false);
      });
    });
  }

  static handleFFmpegNotFound(): void {
    console.error("❌ FFmpeg is not installed or not found in PATH.");
    console.error(
      "Please install FFmpeg from https://ffmpeg.org/download.html"
    );
    process.exit(1);
  }
}
