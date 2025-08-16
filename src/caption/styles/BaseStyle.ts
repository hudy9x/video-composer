import { TextOverlay } from '@/caption/type';

export interface TextStyle {
  apply(filter: string, overlay: TextOverlay, ctx: { videoHeight: number }): string;
}
