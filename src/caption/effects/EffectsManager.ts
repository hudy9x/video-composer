import { BaseEffect } from './BaseEffect';
import { FadeInEffect } from './FadeInEffect';
import { FadeOutEffect } from './FadeOutEffect';
import { SlideUpEffect } from './SlideUpEffect';
import { SlideDownEffect } from './SlideDownEffect';
import { SlideLeftEffect } from './SlideLeftEffect';
import { SlideRightEffect } from './SlideRightEffect';
import { ZoomInEffect } from './ZoomInEffect';
import { ZoomOutEffect } from './ZoomOutEffect';
import { TextOverlay } from '../type';

export class EffectsManager {
  private static effects: Map<string, () => BaseEffect> = new Map([
    ['fade-in', () => new FadeInEffect()],
    ['fade-out', () => new FadeOutEffect()],
    ['slide-up', () => new SlideUpEffect()],
    ['slide-down', () => new SlideDownEffect()],
    ['slide-left', () => new SlideLeftEffect()],
    ['slide-right', () => new SlideRightEffect()],
    ['zoom-in', () => new ZoomInEffect()],
    ['zoom-out', () => new ZoomOutEffect()]
  ]);

  static getEffect(effectType: string): BaseEffect {
    const effectFactory = this.effects.get(effectType);
    if (!effectFactory) {
      throw new Error(`Effect "${effectType}" not found. Available effects: ${Array.from(this.effects.keys()).join(', ')}`);
    }
    return effectFactory();
  }

  static getAllEffects(): BaseEffect[] {
    return Array.from(this.effects.values()).map(factory => factory());
  }

  static listAvailableEffects(): void {
    console.log('Available effects:');
    this.getAllEffects().forEach(effect => {
      console.log(`  ${effect.name} (${effect.type}):`);
      console.log(`    Default duration: ${effect.defaultDuration}s`);
      console.log(`    Description: ${effect.getDescription()}`);
      console.log('');
    });
  }

  static generateEffectFilter(overlay: TextOverlay, coordinates: string, videoHeight: number): string {
    if (!overlay.animation.enabled) {
      return `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
    }

    try {
      const effect = this.getEffect(overlay.animation.type);
      return effect.generateFilter(overlay, coordinates, videoHeight);
    } catch (error) {
      console.warn(`Warning: ${(error as Error).message}. Using default timing.`);
      return `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
    }
  }
}
