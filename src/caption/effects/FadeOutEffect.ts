import { BaseEffect } from './BaseEffect';
import { TextOverlay } from '../type';

export class FadeOutEffect extends BaseEffect {
  constructor() {
    super({
      name: 'Fade Out',
      type: 'fade-out',
      defaultDuration: 0.5,
      ffmpegFilter: () => ''
    });
  }

  generateFilter(overlay: TextOverlay, coordinates: string, videoHeight: number): string {
    const duration = overlay.animation.duration || this.defaultDuration;
    const delay = overlay.animation.delay || 0;
    const fadeOutStart = overlay.endTime - duration - delay;
    
    let filter = `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
    filter += `:alpha='if(gt(t,${fadeOutStart}),(${overlay.endTime}-t)/${duration},1)'`;
    
    return filter;
  }

  getDescription(): string {
    return 'Smooth fade out transition from opaque to transparent';
  }
}
