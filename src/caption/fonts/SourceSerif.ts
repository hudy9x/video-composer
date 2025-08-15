import { BaseFont } from './BaseFont';

export class SourceSerif extends BaseFont {
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
