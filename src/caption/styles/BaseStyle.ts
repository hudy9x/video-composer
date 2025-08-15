import { TextOverlay } from '../type';

export interface TextStyle {
  apply(filter: string, overlay: TextOverlay, ctx: { videoHeight: number }): string;
}
