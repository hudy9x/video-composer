import { TextStyle } from './BaseStyle';
import { TextOverlay } from '@/caption/type';

export class ShadowStyle implements TextStyle {
  apply(filter: string, overlay: TextOverlay, ctx: { videoHeight: number }): string {
    let result = filter;
    
    if (overlay.textShadow && overlay.textShadow.enabled) {
      result += `:shadowx=${overlay.textShadow.offsetX}:shadowy=${overlay.textShadow.offsetY}:shadowcolor=${overlay.textShadow.color}`;
    }
    
    return result;
  }
}
