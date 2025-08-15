import { BaseFont } from './BaseFont';

export class DMSerifDisplayItalic extends BaseFont {
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
