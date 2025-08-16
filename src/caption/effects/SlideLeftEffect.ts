import { BaseEffect } from './BaseEffect';
import { TextOverlay } from '@/caption/type';

export const SLIDE_LEFT_TYPE = 'slide-left' as const;

export class SlideLeftEffect extends BaseEffect {
  static readonly effectName = SLIDE_LEFT_TYPE;
  
  constructor() {
    super({
      name: 'Slide Left',
      type: SLIDE_LEFT_TYPE,
      defaultDuration: 0.8,
      ffmpegFilter: () => ''
    });
  }

  generateFilter(overlay: TextOverlay, coordinates: string, videoHeight: number): string {
    const duration = overlay.animation.duration || this.defaultDuration;
    const delay = overlay.animation.delay || 0;
    const actualStartTime = overlay.startTime + delay;
    const slideEnd = actualStartTime + duration;
    
    let filter = `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
    filter += `:x='if(lt(t,${slideEnd}),w-(t-${actualStartTime})/${duration}*w,${coordinates.split(':')[0]})'`;
    
    return filter;
  }

  getDescription(): string {
    return 'Text slides in from right side of screen';
  }
}
