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
  type: any; // Effect class instance (e.g., new FadeInEffect())
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
  fontFamily: string | any; // Can be string or font class instance
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

export interface VideoDimensions {
  width: number;
  height: number;
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
