import { BaseFont } from './BaseFont';

export const COOKIE_TYPE = 'cookie' as const;

export class Cookie extends BaseFont {
  static readonly fontType = COOKIE_TYPE;
  constructor() {
    super({
      name: 'Cookie',
      path: 'Cookie-Regular.ttf',
      family: 'Cookie-Regular.ttf'
    });
  }

  getRecommendedSize(): number {
    return 8; // 8% of video height
  }

  getDescription(): string {
    return 'Playful script font for creative and casual content';
  }
}
