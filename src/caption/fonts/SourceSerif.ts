import { BaseFont } from './BaseFont';

export const SOURCE_SERIF_TYPE = 'source-serif' as const;

export class SourceSerif extends BaseFont {
  static readonly fontType = SOURCE_SERIF_TYPE;
  constructor() {
    super({
      name: 'Source Serif',
      path: 'SourceSerif4.ttf',
      family: 'SourceSerif4.ttf'
    });
  }

  getRecommendedSize(): number {
    return 5; // 5% of video height
  }

  getDescription(): string {
    return 'Professional serif font for body text and formal content';
  }
}
