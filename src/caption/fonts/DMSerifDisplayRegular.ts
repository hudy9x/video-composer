import { BaseFont } from './BaseFont';

export class DMSerifDisplayRegular extends BaseFont {
  constructor() {
    super({
      name: 'DM Serif Display Regular',
      path: 'DMSerifDisplay-Regular.ttf',
      family: 'DMSerifDisplay-Regular.ttf'
    });
  }

  getRecommendedSize(): number {
    return 5; // 5% of video height
  }

  getDescription(): string {
    return 'Clean serif font for professional and readable text';
  }
}
