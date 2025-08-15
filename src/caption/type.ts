import {
  FADE_IN_TYPE,
  FADE_OUT_TYPE,
  SLIDE_UP_TYPE,
  SLIDE_DOWN_TYPE,
  SLIDE_LEFT_TYPE,
  SLIDE_RIGHT_TYPE,
  ZOOM_IN_TYPE,
  ZOOM_OUT_TYPE
} from './effects';
import {
  DM_SERIF_DISPLAY_ITALIC_TYPE,
  DM_SERIF_DISPLAY_REGULAR_TYPE,
  ARCHIVO_BLACK_TYPE,
  COOKIE_TYPE,
  FJALLA_ONE_TYPE,
  SOURCE_SERIF_TYPE,
  SOURCE_SERIF_ITALIC_TYPE
} from './fonts';

export type EffectType = 
  | typeof FADE_IN_TYPE
  | typeof FADE_OUT_TYPE
  | typeof SLIDE_UP_TYPE
  | typeof SLIDE_DOWN_TYPE
  | typeof SLIDE_LEFT_TYPE
  | typeof SLIDE_RIGHT_TYPE
  | typeof ZOOM_IN_TYPE
  | typeof ZOOM_OUT_TYPE;

export type FontType = 
  | typeof DM_SERIF_DISPLAY_ITALIC_TYPE
  | typeof DM_SERIF_DISPLAY_REGULAR_TYPE
  | typeof ARCHIVO_BLACK_TYPE
  | typeof COOKIE_TYPE
  | typeof FJALLA_ONE_TYPE
  | typeof SOURCE_SERIF_TYPE
  | typeof SOURCE_SERIF_ITALIC_TYPE;

export interface Position {
  x: string | number;
  y: string | number;
}

export interface TextOutline {
  enabled: boolean;
  color: string;
  width: number;
}

export interface TextShadow {
  enabled: boolean;
  color: string;
  offsetX: number;
  offsetY: number;
}

export interface TextBox {
  enabled: boolean;
  color: string;
  padding: number;
}

export interface Animation {
  enabled: boolean;
  type: EffectType; // Effect type enum (e.g., EffectType.FADE_IN)
  duration: number;
  delay?: number;
}

export interface TextElement {
  text: string;
  line: number;
  fontSize?: number;
  fontColor?: string;
  textOutline?: Partial<TextOutline>;
  textShadow?: Partial<TextShadow>;
  textBox?: Partial<TextBox>;
  animation?: Partial<Animation>;
  startTime?: number;
  endTime?: number;
  textAlign?: 'left' | 'center' | 'right';
}

export interface TextOverlay {
  text: string;
  textElements?: TextElement[];
  startTime: number;
  endTime: number;
  fontSize: number;
  fontFamily: FontType; // Font type string identifier
  fontColor: string;
  position: Position;
  textAlign?: 'left' | 'center' | 'right';
  textOutline: TextOutline;
  textShadow: TextShadow;
  textBox: TextBox;
  animation: Animation;
  fontPath?: string;
  fontInstance?: any; // Will hold the font class instance
  _isMultiLine?: boolean;
  _originalText?: string;
  _lineIndex?: number;
  _totalLines?: number;
  _isTextElement?: boolean;
  _elementIndex?: number;
  _totalElements?: number;
}

export interface Config {
  textOverlays: TextOverlay[];
}



export interface CommandLineOptions {
  inputFile: string;
  outputFile?: string;
  configFile?: string;
  help?: boolean;
  version?: boolean;
}

export interface FontConfig {
  name: string;
  path: string;
  family: string;
}

export interface EffectConfig {
  name: string;
  type: Animation['type'];
  defaultDuration: number;
  ffmpegFilter: (overlay: TextOverlay, startTime: number, endTime: number, duration: number) => string;
}
