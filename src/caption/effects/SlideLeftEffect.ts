import { BaseEffect } from './BaseEffect';
import { TextOverlay } from '../type';

export class SlideLeftEffect extends BaseEffect {
  constructor() {
    super({
      name: 'Slide Left',
      type: 'slide-left',
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
