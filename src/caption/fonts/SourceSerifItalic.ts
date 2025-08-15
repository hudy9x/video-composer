import { BaseFont } from './BaseFont';

export const SOURCE_SERIF_ITALIC_TYPE = 'source-serif-italic' as const;

export class SourceSerifItalic extends BaseFont {
  static readonly fontType = SOURCE_SERIF_ITALIC_TYPE;
  constructor() {
    super({
      name: 'Source Serif Italic',
      path: 'SourceSerif4-Italic.ttf',
      family: 'SourceSerif4-Italic.ttf'
    });
  }

  getRecommendedSize(): number {
    return 5; // 5% of video height
  }

  getDescription(): string {
    return 'Professional serif font with italic style for emphasis';
  }
}
