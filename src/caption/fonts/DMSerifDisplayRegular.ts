import { BaseFont } from './BaseFont';

export const DM_SERIF_DISPLAY_REGULAR_TYPE = 'dm-serif-display-regular' as const;

export class DMSerifDisplayRegular extends BaseFont {
  static readonly fontType = DM_SERIF_DISPLAY_REGULAR_TYPE;
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
