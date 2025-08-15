import { BaseFont } from './BaseFont';

export class ArchivoBlack extends BaseFont {
  constructor() {
    super({
      name: 'Archivo Black',
      path: 'ArchivoBlack-Regular.ttf',
      family: 'ArchivoBlack-Regular.ttf'
    });
  }

  getRecommendedSize(): number {
    return 7; // 7% of video height
  }

  getDescription(): string {
    return 'Bold and impactful font for strong statements and headers';
  }
}
