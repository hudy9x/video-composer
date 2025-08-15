import * as path from 'path';
import * as fs from 'fs';
import { FontConfig } from '../type';

export abstract class BaseFont {
  protected config: FontConfig;
  private static fontsDir: string = path.join(__dirname, './sources');

  constructor(config: FontConfig) {
    this.config = config;
  }

  get name(): string {
    return this.config.name;
  }

  get path(): string {
    return this.config.path;
  }

  get family(): string {
    return this.config.family;
  }

  /**
   * Get the full path to this font file
   */
  getFullPath(): string {
    return path.join(BaseFont.fontsDir, this.config.path);
  }

  /**
   * Check if this font file exists
   */
  exists(): boolean {
    return fs.existsSync(this.getFullPath());
  }

  /**
   * Validate this font and throw error if not found
   */
  validate(): void {
    if (!this.exists()) {
      throw new Error(`Font file "${this.config.path}" for "${this.config.name}" not found. Expected path: ${this.getFullPath()}`);
    }
  }

  /**
   * Get the fonts directory path
   */
  static getFontsDirectory(): string {
    return BaseFont.fontsDir;
  }

  /**
   * Check if fonts directory exists
   */
  static fontsDirExists(): boolean {
    return fs.existsSync(BaseFont.fontsDir);
  }

  /**
   * Get list of available font files in fonts directory
   */
  static getAvailableFontFiles(): string[] {
    if (!BaseFont.fontsDirExists()) {
      return [];
    }
    
    return fs.readdirSync(BaseFont.fontsDir).filter(f => 
      f.endsWith('.ttf') || f.endsWith('.otf') || f.endsWith('.TTF') || f.endsWith('.OTF')
    );
  }

  /**
   * Validate fonts directory exists
   */
  static validateFontsDirectory(): void {
    if (!BaseFont.fontsDirExists()) {
      throw new Error(`Fonts directory does not exist: ${BaseFont.fontsDir}`);
    }
  }

  abstract getRecommendedSize(): number;
  abstract getDescription(): string;
}
