import { BaseFont } from './BaseFont';

export const DM_SERIF_DISPLAY_ITALIC_TYPE = 'dm-serif-display-italic' as const;

export class DMSerifDisplayItalic extends BaseFont {
  static readonly fontType = DM_SERIF_DISPLAY_ITALIC_TYPE;
  constructor() {
    super({
      name: 'DM Serif Display Italic',
      path: 'DMSerifDisplay-Italic.ttf',
      family: 'DMSerifDisplay-Italic.ttf'
    });
  }

  getRecommendedSize(): number {
    return 6; // 6% of video height
  }

  getDescription(): string {
    return 'Elegant serif font with italic style, perfect for titles and emphasis';
  }
}
