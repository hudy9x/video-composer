import { TextStyle } from './BaseStyle';
import { TextOverlay } from '../type';

export class OutlineStyle implements TextStyle {
  apply(filter: string, overlay: TextOverlay, ctx: { videoHeight: number }): string {
    let result = filter;
    
    if (overlay.textOutline && overlay.textOutline.enabled) {
      result += `:borderw=${overlay.textOutline.width}:bordercolor=${overlay.textOutline.color}`;
    }
    
    return result;
  }
}
