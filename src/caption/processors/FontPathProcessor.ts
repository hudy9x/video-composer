import { BaseProcessor, ProcessingContext } from './BaseProcessor';
import { TextOverlay } from '@/caption/type';
import { BaseFont, FontFactory } from '@/caption/fonts';

export class FontPathProcessor extends BaseProcessor {
  protected handleProcess(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[] {
    return overlays.map(overlay => {
      try {
        // Get font instance from factory using the font type
        const fontInstance = FontFactory.getFont(overlay.fontFamily);
        const fontPath = fontInstance.getFullPath();
        
        // Validate font exists
        if (!fontInstance.exists()) {
          console.error(`❌ Font file not found: ${fontPath}`);
          console.error(`   Font type: ${overlay.fontFamily}`);
          console.error(`   Font name: ${fontInstance.name}`);
          throw new Error(`Font file not found: ${fontPath}`);
        }
        
        console.log(`✅ Font loaded: ${fontInstance.name} -> ${fontPath}`);

        return {
          ...overlay,
          fontPath,
          fontInstance,
        };
      } catch (error) {
        console.error(`❌ Error processing font for overlay: "${overlay.text}"`);
        console.error(`   Font family: ${overlay.fontFamily}`);
        throw error;
      }
    });
  }
}
