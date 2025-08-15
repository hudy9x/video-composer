import { BaseEffect } from './BaseEffect';
import { TextOverlay } from '../type';

export const SLIDE_UP_TYPE = 'slide-up' as const;

export class SlideUpEffect extends BaseEffect {
  static readonly effectName = SLIDE_UP_TYPE;
  
  constructor() {
    super({
      name: 'Slide Up',
      type: SLIDE_UP_TYPE,
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
    filter += `:y='if(lt(t,${slideEnd}),h+(${slideEnd}-t)/${duration}*h*0.1-text_h,${coordinates.split(':')[1]})'`;
    
    return filter;
  }

  getDescription(): string {
    return 'Text slides up from bottom of screen';
  }
}
