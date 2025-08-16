import * as path from 'path';
import * as fs from 'fs';
import { BaseFont } from './BaseFont';
import { DMSerifDisplayItalic } from './DMSerifDisplayItalic';
import { DMSerifDisplayRegular } from './DMSerifDisplayRegular';
import { ArchivoBlack } from './ArchivoBlack';
import { Cookie } from './Cookie';
import { FjallaOne } from './FjallaOne';
import { SourceSerif } from './SourceSerif';
import { SourceSerifItalic } from './SourceSerifItalic';

export class FontManager {
  private static fonts: Map<string, () => BaseFont> = new Map([
    ['dm-serif-italic', () => new DMSerifDisplayItalic()],
    ['dm-serif-regular', () => new DMSerifDisplayRegular()],
    ['archivo-black', () => new ArchivoBlack()],
    ['cookie', () => new Cookie()],
    ['fjalla-one', () => new FjallaOne()],
    ['source-serif', () => new SourceSerif()],
    ['source-serif-italic', () => new SourceSerifItalic()]
  ]);

  private static fontsDir: string = path.join(__dirname, '../../../fonts');

  static getFont(fontKey: string): BaseFont {
    const fontFactory = this.fonts.get(fontKey);
    if (!fontFactory) {
      throw new Error(`Font "${fontKey}" not found. Available fonts: ${Array.from(this.fonts.keys()).join(', ')}`);
    }
    return fontFactory();
  }

  static getAllFonts(): BaseFont[] {
    return Array.from(this.fonts.values()).map(factory => factory());
  }

  static validateFont(font: BaseFont): void {
    const fontPath = path.join(this.fontsDir, font.path);
    if (!fs.existsSync(fontPath)) {
      throw new Error(`Font file "${font.path}" not found in fonts directory. Expected path: ${fontPath}`);
    }
  }

  static validateAllFonts(): void {
    if (!fs.existsSync(this.fontsDir)) {
      throw new Error(`Fonts directory does not exist: ${this.fontsDir}`);
    }

    const availableFonts = fs.readdirSync(this.fontsDir).filter(f => 
      f.endsWith('.ttf') || f.endsWith('.otf') || f.endsWith('.TTF') || f.endsWith('.OTF')
    );

    console.log('Available fonts in fonts directory:');
    availableFonts.forEach(font => console.log(`  - ${font}`));
    console.log('');

    this.getAllFonts().forEach(font => {
      try {
        this.validateFont(font);
      } catch (error) {
        console.warn(`Warning: ${(error as Error).message}`);
      }
    });
  }

  static getFontPath(font: BaseFont): string {
    return path.join(this.fontsDir, font.path);
  }

  static listAvailableFonts(): void {
    console.log('Available font classes:');
    this.getAllFonts().forEach(font => {
      console.log(`  ${font.name}:`);
      console.log(`    Key: ${Array.from(this.fonts.entries()).find(([, factory]) => factory().name === font.name)?.[0]}`);
      console.log(`    File: ${font.path}`);
      console.log(`    Recommended size: ${font.getRecommendedSize()}%`);
      console.log(`    Description: ${font.getDescription()}`);
      console.log('');
    });
  }
}
