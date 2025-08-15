import { BaseFont } from './BaseFont';

export const FJALLA_ONE_TYPE = 'fjalla-one' as const;

export class FjallaOne extends BaseFont {
  static readonly fontType = FJALLA_ONE_TYPE;
  constructor() {
    super({
      name: 'Fjalla One',
      path: 'FjallaOne-Regular.ttf',
      family: 'FjallaOne-Regular.ttf'
    });
  }

  getRecommendedSize(): number {
    return 6; // 6% of video height
  }

  getDescription(): string {
    return 'Modern sans-serif font with strong character';
  }
}
