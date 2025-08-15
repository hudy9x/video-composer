import { BaseEffect } from './BaseEffect';
import { TextOverlay } from '../type';

export class SlideRightEffect extends BaseEffect {
  constructor() {
    super({
      name: 'Slide Right',
      type: 'slide-right',
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
    filter += `:x='if(lt(t,${slideEnd}),-text_w+(t-${actualStartTime})/${duration}*(${coordinates.split(':')[0]}+text_w),${coordinates.split(':')[0]})'`;
    
    return filter;
  }

  getDescription(): string {
    return 'Text slides in from left side of screen';
  }
}
