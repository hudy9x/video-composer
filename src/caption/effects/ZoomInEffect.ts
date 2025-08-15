import { BaseEffect } from './BaseEffect';
import { TextOverlay } from '../type';

export class ZoomInEffect extends BaseEffect {
  constructor() {
    super({
      name: 'Zoom In',
      type: 'zoom-in',
      defaultDuration: 0.6,
      ffmpegFilter: () => ''
    });
  }

  generateFilter(overlay: TextOverlay, coordinates: string, videoHeight: number): string {
    const duration = overlay.animation.duration || this.defaultDuration;
    const delay = overlay.animation.delay || 0;
    const actualStartTime = overlay.startTime + delay;
    const zoomEnd = actualStartTime + duration;
    
    // Note: FFmpeg drawtext doesn't directly support scaling, so we simulate with font size changes
    let filter = `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
    // This is a simplified version - for true zoom, we'd need to use scale filter on the text
    filter += `:alpha='if(lt(t,${zoomEnd}),(t-${actualStartTime})/${duration},1)'`;
    
    return filter;
  }

  getDescription(): string {
    return 'Text zooms in with scale animation (simulated with fade)';
  }
}
