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
  type: 'fade' | 'slide-in';
  duration: number;
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
  fontFamily: string;
  fontColor: string;
  position: Position;
  textAlign?: 'left' | 'center' | 'right';
  textOutline: TextOutline;
  textShadow: TextShadow;
  textBox: TextBox;
  animation: Animation;
  fontPath?: string;
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
