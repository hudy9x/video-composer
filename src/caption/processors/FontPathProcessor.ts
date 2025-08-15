import { BaseProcessor, ProcessingContext } from './BaseProcessor';
import { TextOverlay } from '../type';
import { BaseFont } from '../fonts';

export class FontPathProcessor extends BaseProcessor {
  protected handleProcess(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[] {
    return overlays.map(overlay => {
      let fontPath: string;
      let fontInstance: any = null;

      if (typeof overlay.fontFamily === "string") {
        // Legacy string-based font handling
        fontPath = overlay.fontFamily;
      } else {
        // Font class instance
        fontInstance = overlay.fontFamily;
        fontPath = fontInstance.getFullPath();
      }

      return {
        ...overlay,
        fontPath,
        fontInstance,
      };
    });
  }
}
