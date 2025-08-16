import { Config, TextOverlay } from '@/caption/type';
import { FontFactory } from '@/caption/fonts';
import { BaseFont } from '@/caption/fonts';

export class ValidationService {
  static validateConfiguration(config: Config): void {
    // Validate fonts directory exists using BaseFont
    try {
      BaseFont.validateFontsDirectory();
    } catch (error) {
      console.error("Error: ./fonts folder does not exist");
      console.error(
        "Please create a ./fonts folder and place your font files there"
      );
      console.error(`Expected path: ${BaseFont.getFontsDirectory()}`);
      process.exit(1);
    }

    // Validate each text overlay
    config.textOverlays.forEach((overlay, index) => {
      this.validateOverlay(overlay, index);
    });
  }

  private static validateOverlay(overlay: TextOverlay, index: number): void {
    // Validate font using FontFactory
    try {
      const fontInstance = FontFactory.getFont(overlay.fontFamily);
      fontInstance.validate();
    } catch (error) {
      console.error(
        `Error: ${(error as Error).message} (text overlay ${index + 1})`
      );
      console.error(`Available fonts in ./fonts:`);
      const fonts = BaseFont.getAvailableFontFiles();
      fonts.forEach((font) => console.error(`  - ${font}`));
      process.exit(1);
    }

    // Validate timing
    if (overlay.startTime >= overlay.endTime) {
      console.error(
        `Error: Text overlay ${index + 1} has invalid timing. startTime (${
          overlay.startTime
        }) must be less than endTime (${overlay.endTime})`
      );
      process.exit(1);
    }

    // Validate font size
    if (overlay.fontSize <= 0) {
      console.error(
        `Error: Text overlay ${
          index + 1
        } has invalid fontSize. Must be greater than 0`
      );
      process.exit(1);
    }
  }
}
