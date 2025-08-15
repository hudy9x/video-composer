import { TextStyle } from './BaseStyle';
import { TextOverlay } from '../type';

export class ColorStyle implements TextStyle {
  apply(filter: string, overlay: TextOverlay, ctx: { videoHeight: number }): string {
    let result = filter;
    
    if (overlay.fontColor) {
      result += `:fontcolor=${overlay.fontColor}`;
    }
    
    return result;
  }
}
