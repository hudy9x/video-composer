import { TextOverlay, EffectConfig } from '../type';

export abstract class BaseEffect {
  protected config: EffectConfig;

  constructor(config: EffectConfig) {
    this.config = config;
  }

  get name(): string {
    return this.config.name;
  }

  get type(): string {
    return this.config.type;
  }

  get defaultDuration(): number {
    return this.config.defaultDuration;
  }

  abstract generateFilter(overlay: TextOverlay, coordinates: string, videoHeight: number): string;
  abstract getDescription(): string;
}
