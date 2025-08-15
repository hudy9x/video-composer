import { TextStyle } from './BaseStyle';
import { TextOverlay } from '../type';

export class BoxStyle implements TextStyle {
  apply(filter: string, overlay: TextOverlay, ctx: { videoHeight: number }): string {
    let result = filter;
    
    if (overlay.textBox && overlay.textBox.enabled) {
      result += `:box=1:boxcolor=${overlay.textBox.color}:boxborderw=${overlay.textBox.padding}`;
    }
    
    return result;
  }
}
