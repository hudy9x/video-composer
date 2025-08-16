import { BaseEffect } from './BaseEffect';
import { TextOverlay } from '@/caption/type';

export const FADE_OUT_TYPE = 'fade-out' as const;

export class FadeOutEffect extends BaseEffect {
  static readonly effectName = FADE_OUT_TYPE;
  
  constructor() {
    super({
      name: 'Fade Out',
      type: FADE_OUT_TYPE,
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
