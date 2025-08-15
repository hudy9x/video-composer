import { BaseEffect } from './BaseEffect';
import { TextOverlay } from '../type';

export class ZoomOutEffect extends BaseEffect {
  constructor() {
    super({
      name: 'Zoom Out',
      type: 'zoom-out',
      defaultDuration: 0.6,
      ffmpegFilter: () => ''
    });
  }

  generateFilter(overlay: TextOverlay, coordinates: string, videoHeight: number): string {
    const duration = overlay.animation.duration || this.defaultDuration;
    const delay = overlay.animation.delay || 0;
    const zoomStart = overlay.endTime - duration - delay;
    
    // Note: FFmpeg drawtext doesn't directly support scaling, so we simulate with alpha
    let filter = `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
    filter += `:alpha='if(gt(t,${zoomStart}),(${overlay.endTime}-t)/${duration},1)'`;
    
    return filter;
  }

  getDescription(): string {
    return 'Text zooms out with scale animation (simulated with fade)';
  }
}
