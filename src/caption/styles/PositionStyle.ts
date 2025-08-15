import { TextStyle } from './BaseStyle';
import { TextOverlay, Position } from '../type';

export class PositionStyle implements TextStyle {
  apply(filter: string, overlay: TextOverlay, ctx: { videoHeight: number }): string {
    let result = filter;
    
    const coordinates = this.getPositionCoordinates(overlay.position, 1920, ctx.videoHeight, overlay.textAlign);
    const [x, y] = coordinates.split(':');
    result += `:x=${x}:y=${y}`;
    
    return result;
  }

  private getPositionCoordinates(position: string | Position, videoWidth: number = 1920, videoHeight: number = 1080, textAlign: 'left' | 'center' | 'right' = 'center'): string {
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
      
      // Handle Y coordinate (unchanged)
      if (typeof position.y === 'string' && position.y.includes('%')) {
        // Percentage positioning: '60%' -> h*0.6-text_h/2
        const percentage = parseFloat(position.y.replace('%', '')) / 100;
        y = `h*${percentage}-text_h/2`;
      } else if (typeof position.y === 'number' || (typeof position.y === 'string' && !isNaN(parseFloat(position.y)))) {
        // Fixed pixel positioning: 1200 -> '1200'
        y = position.y.toString();
      } else {
        // Fallback to center
        y = '(h-text_h)/2';
      }
      
      return `${x}:${y}`;
    }

    const positions: { [key: string]: string } = {
      'top-left': '50:50',
      'top-center': '(w-text_w)/2:50',
      'top-right': 'w-text_w-50:50',
      'middle-left': '50:(h-text_h)/2',
      'middle-center': '(w-text_w)/2:(h-text_h)/2',
      'middle-right': 'w-text_w-50:(h-text_h)/2',
      'bottom-left': '50:h-text_h-50',
      'bottom-center': '(w-text_w)/2:h-text_h-50',
      'bottom-right': 'w-text_w-50:h-text_h-50',
      'center': '(w-text_w)/2:(h-text_h)/2'
    };

    return positions[position as string] || positions['center'];
  }
}
