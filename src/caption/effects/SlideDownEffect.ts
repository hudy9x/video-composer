import { BaseEffect } from './BaseEffect';
import { TextOverlay } from '@/caption/type';

export const SLIDE_DOWN_TYPE = 'slide-down' as const;

export class SlideDownEffect extends BaseEffect {
  static readonly effectName = SLIDE_DOWN_TYPE;
  
  constructor() {
    super({
      name: 'Slide Down',
      type: SLIDE_DOWN_TYPE,
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
    filter += `:y='if(lt(t,${slideEnd}),-text_h+(t-${actualStartTime})/${duration}*(${coordinates.split(':')[1]}+text_h),${coordinates.split(':')[1]})'`;
    
    return filter;
  }

  getDescription(): string {
    return 'Text slides down from top of screen';
  }
}
