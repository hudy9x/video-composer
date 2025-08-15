import { BaseFont } from './BaseFont';

export class FjallaOne extends BaseFont {
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
