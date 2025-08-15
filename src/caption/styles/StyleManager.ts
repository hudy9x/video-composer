import { TextStyle } from './BaseStyle';
import { TextOverlay } from '../type';
import { FontStyle } from './FontStyle';
import { ColorStyle } from './ColorStyle';
import { OutlineStyle } from './OutlineStyle';
import { ShadowStyle } from './ShadowStyle';
import { BoxStyle } from './BoxStyle';
import { PositionStyle } from './PositionStyle';
import { AnimationStyle } from './AnimationStyle';

export class StyleManager {
  private styles: TextStyle[] = [
    new FontStyle(),
    new ColorStyle(),
    new OutlineStyle(),
    new ShadowStyle(),
    new BoxStyle(),
    new PositionStyle(),
    new AnimationStyle()
  ];

  buildFilter(overlay: TextOverlay, ctx: { videoHeight: number }): string {
    // Start with base drawtext command
    const escapedText = overlay.text.replace(/'/g, "\\'").replace(/:/g, "\\:");
    let filter = `drawtext=text='${escapedText}'`;
    
    // Apply each style decorator in sequence
    for (const style of this.styles) {
      filter = style.apply(filter, overlay, ctx);
    }
    
    return filter;
  }
}
