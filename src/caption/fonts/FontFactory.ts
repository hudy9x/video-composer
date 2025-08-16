import { FontType } from '@/caption/type';
import { BaseFont } from './BaseFont';
import {
  Fonts_DMSerifDisplayItalic,
  Fonts_DMSerifDisplayRegular,
  Fonts_ArchivoBlack,
  Fonts_Cookie,
  Fonts_FjallaOne,
  Fonts_SourceSerif,
  Fonts_SourceSerifItalic,
  DM_SERIF_DISPLAY_ITALIC_TYPE,
  DM_SERIF_DISPLAY_REGULAR_TYPE,
  ARCHIVO_BLACK_TYPE,
  COOKIE_TYPE,
  FJALLA_ONE_TYPE,
  SOURCE_SERIF_TYPE,
  SOURCE_SERIF_ITALIC_TYPE
} from './index';

export class FontFactory {
  private static fontInstances: Map<FontType, BaseFont> = new Map();

  static getFont(fontType: FontType): BaseFont {
    // Use cached instance if available
    if (this.fontInstances.has(fontType)) {
      return this.fontInstances.get(fontType)!;
    }

    // Create new instance based on type
    let font: BaseFont;
    
    switch (fontType) {
      case DM_SERIF_DISPLAY_ITALIC_TYPE:
        font = new Fonts_DMSerifDisplayItalic();
        break;
      case DM_SERIF_DISPLAY_REGULAR_TYPE:
        font = new Fonts_DMSerifDisplayRegular();
        break;
      case ARCHIVO_BLACK_TYPE:
        font = new Fonts_ArchivoBlack();
        break;
      case COOKIE_TYPE:
        font = new Fonts_Cookie();
        break;
      case FJALLA_ONE_TYPE:
        font = new Fonts_FjallaOne();
        break;
      case SOURCE_SERIF_TYPE:
        font = new Fonts_SourceSerif();
        break;
      case SOURCE_SERIF_ITALIC_TYPE:
        font = new Fonts_SourceSerifItalic();
        break;
      default:
        throw new Error(`Unknown font type: ${fontType}`);
    }

    // Cache the instance
    this.fontInstances.set(fontType, font);
    return font;
  }

  static getAllFontTypes(): FontType[] {
    return [
      DM_SERIF_DISPLAY_ITALIC_TYPE,
      DM_SERIF_DISPLAY_REGULAR_TYPE,
      ARCHIVO_BLACK_TYPE,
      COOKIE_TYPE,
      FJALLA_ONE_TYPE,
      SOURCE_SERIF_TYPE,
      SOURCE_SERIF_ITALIC_TYPE
    ];
  }

  static getFontDisplayName(fontType: FontType): string {
    const font = this.getFont(fontType);
    return font.name;
  }
}
