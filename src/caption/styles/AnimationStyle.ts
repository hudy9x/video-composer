import { TextStyle } from './BaseStyle';
import { TextOverlay } from '../type';
import { EffectFactory } from '../effects';

export class AnimationStyle implements TextStyle {
  apply(filter: string, overlay: TextOverlay, ctx: { videoHeight: number }): string {
    let result = filter;
    
    // Handle timing and effects
    if (overlay.animation && overlay.animation.enabled && overlay.animation.type) {
      try {
        // Get the effect instance from the factory
        const effectInstance = EffectFactory.getEffect(overlay.animation.type);
        // Recompute coordinates for the effect
        const coordinates = this.getCoordinatesForEffect(overlay, ctx.videoHeight);
        const effectFilter = effectInstance.generateFilter(overlay, coordinates, ctx.videoHeight);
        result += effectFilter;
      } catch (error) {
        console.warn(`Warning: Error generating effect filter: ${(error as Error).message}. Using default timing.`);
        result += `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
      }
    } else {
      // No animation, just show between start and end time
      result += `:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
    }
    
    return result;
  }

  private getCoordinatesForEffect(overlay: TextOverlay, videoHeight: number): string {
    // Recompute coordinates similar to PositionStyle for effect generation
    const position = overlay.position;
    const textAlign = overlay.textAlign || 'center';
    
    if (typeof position === 'object' && position.x !== undefined && position.y !== undefined) {
      let x: string, y: string;
      
      // Handle X coordinate with text alignment
      if (typeof position.x === 'string' && position.x.includes('%')) {
        const percentage = parseFloat(position.x.replace('%', '')) / 100;
        
        // Apply text alignment
        switch (textAlign) {
          case 'left':
            x = `w*${percentage}`;
            break;
          case 'right':
            x = `w*${percentage}-text_w`;
            break;
          case 'center':
          default:
            x = `w*${percentage}-text_w/2`;
            break;
        }
      } else if (typeof position.x === 'number' || (typeof position.x === 'string' && !isNaN(parseFloat(position.x)))) {
        // Fixed pixel positioning with alignment
        const pixelX = typeof position.x === 'number' ? position.x : parseFloat(position.x);
        switch (textAlign) {
          case 'left':
            x = pixelX.toString();
            break;
          case 'right':
            x = `${pixelX}-text_w`;
            break;
          case 'center':
          default:
            x = `${pixelX}-text_w/2`;
            break;
        }
      } else {
        // Fallback to center
        x = '(w-text_w)/2';
      }
      
      // Handle Y coordinate
      if (typeof position.y === 'string' && position.y.includes('%')) {
        const percentage = parseFloat(position.y.replace('%', '')) / 100;
        y = `h*${percentage}-text_h/2`;
      } else if (typeof position.y === 'number' || (typeof position.y === 'string' && !isNaN(parseFloat(position.y)))) {
        y = position.y.toString();
      } else {
        y = '(h-text_h)/2';
      }
      
      return `${x}:${y}`;
    }

    // Default position fallback
    return '(w-text_w)/2:(h-text_h)/2';
  }
}
