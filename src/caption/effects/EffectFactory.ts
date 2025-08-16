import { EffectType } from '@/caption/type';
import { BaseEffect } from './BaseEffect';
import {
  Effect_FadeIn,
  Effect_FadeOut,
  Effect_SlideUp,
  Effect_SlideDown,
  Effect_SlideLeft,
  Effect_SlideRight,
  Effect_ZoomIn,
  Effect_ZoomOut,
  FADE_IN_TYPE,
  FADE_OUT_TYPE,
  SLIDE_UP_TYPE,
  SLIDE_DOWN_TYPE,
  SLIDE_LEFT_TYPE,
  SLIDE_RIGHT_TYPE,
  ZOOM_IN_TYPE,
  ZOOM_OUT_TYPE
} from './index';

export class EffectFactory {
  private static effectInstances: Map<EffectType, BaseEffect> = new Map();

  static getEffect(effectType: EffectType): BaseEffect {
    // Use cached instance if available
    if (this.effectInstances.has(effectType)) {
      return this.effectInstances.get(effectType)!;
    }

    // Create new instance based on type
    let effect: BaseEffect;
    
    switch (effectType) {
      case FADE_IN_TYPE:
        effect = new Effect_FadeIn();
        break;
      case FADE_OUT_TYPE:
        effect = new Effect_FadeOut();
        break;
      case SLIDE_UP_TYPE:
        effect = new Effect_SlideUp();
        break;
      case SLIDE_DOWN_TYPE:
        effect = new Effect_SlideDown();
        break;
      case SLIDE_LEFT_TYPE:
        effect = new Effect_SlideLeft();
        break;
      case SLIDE_RIGHT_TYPE:
        effect = new Effect_SlideRight();
        break;
      case ZOOM_IN_TYPE:
        effect = new Effect_ZoomIn();
        break;
      case ZOOM_OUT_TYPE:
        effect = new Effect_ZoomOut();
        break;
      default:
        throw new Error(`Unknown effect type: ${effectType}`);
    }

    // Cache the instance
    this.effectInstances.set(effectType, effect);
    return effect;
  }

  static getAllEffectTypes(): EffectType[] {
    return [
      FADE_IN_TYPE,
      FADE_OUT_TYPE,
      SLIDE_UP_TYPE,
      SLIDE_DOWN_TYPE,
      SLIDE_LEFT_TYPE,
      SLIDE_RIGHT_TYPE,
      ZOOM_IN_TYPE,
      ZOOM_OUT_TYPE
    ];
  }
}
