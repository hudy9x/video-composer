import { BaseEffect } from './BaseEffect';
import { TextOverlay } from '../type';

export class FadeInEffect extends BaseEffect {
  constructor() {
    super({
      name: 'Fade In',
      type: 'fade-in',
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
