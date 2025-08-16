import { BaseEffect } from './BaseEffect';
import { TextOverlay } from '@/caption/type';

export const FADE_IN_TYPE = 'fade-in' as const;

export class FadeInEffect extends BaseEffect {
  static readonly effectName = FADE_IN_TYPE;
  
  constructor() {
    super({
      name: 'Fade In',
      type: FADE_IN_TYPE,
      defaultDuration: 0.5,
      ffmpegFilter: () => '' // Not used in this implementation
    });
  }

  generateFilter(overlay: TextOverlay, coordinates: string, videoHeight: number): string {
    const duration = overlay.animation.duration || this.defaultDuration;
    const delay = overlay.animation.delay || 0;
    const actualStartTime = overlay.startTime + delay;
    const fadeInEnd = actualStartTime + duration;
    
    let filter = `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
    filter += `:alpha='if(lt(t,${fadeInEnd}),(t-${actualStartTime})/${duration},1)'`;
    
    return filter;
  }

  getDescription(): string {
    return 'Smooth fade in transition from transparent to opaque';
  }
}
