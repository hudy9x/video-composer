import { TextStyle } from './BaseStyle';
import { TextOverlay } from '../type';

export class FontStyle implements TextStyle {
  apply(filter: string, overlay: TextOverlay, ctx: { videoHeight: number }): string {
    let result = filter;
    
    // Add font file
    if (overlay.fontPath) {
      result += `:fontfile='${overlay.fontPath.replace(/\\/g, '/')}'`;
    }
    
    // Calculate and add font size
    const actualFontSize = this.calculateFontSize(overlay.fontSize, ctx.videoHeight);
    result += `:fontsize=${actualFontSize}`;
    
    return result;
  }

  private calculateFontSize(fontSize: number, videoHeight: number): number {
    // Font size system:
    // 1-20 (including decimals): Percentage of video height
    // > 20: Fixed pixel size
    
    if (fontSize <= 20) {
      // Treat as percentage of video height
      return Math.round((fontSize / 100) * videoHeight);
    } else {
      // Treat as fixed pixel size
      return fontSize;
    }
  }
}
