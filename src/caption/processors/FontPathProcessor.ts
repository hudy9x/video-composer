import { BaseProcessor, ProcessingContext } from './BaseProcessor';
import { TextOverlay } from '../type';
import { BaseFont, FontFactory } from '../fonts';

export class FontPathProcessor extends BaseProcessor {
  protected handleProcess(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[] {
    return overlays.map(overlay => {
      // Get font instance from factory using the font type
      const fontInstance = FontFactory.getFont(overlay.fontFamily);
      const fontPath = fontInstance.getFullPath();

      return {
        ...overlay,
        fontPath,
        fontInstance,
      };
    });
  }
}
