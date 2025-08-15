# Processors Layer

## Purpose

The `processors/` folder implements the Chain of Responsibility pattern to handle overlay processing. Each processor in the chain handles a specific aspect of overlay transformation, allowing for flexible and extensible processing pipelines.

## Design Pattern: Chain of Responsibility

The Chain of Responsibility pattern is used to:

- **Decouple Processing Steps**: Each processor handles one specific transformation
- **Enable Sequential Processing**: Overlays flow through a chain of processors
- **Allow Dynamic Chain Configuration**: Processors can be added/removed/reordered
- **Promote Single Responsibility**: Each processor has one clear purpose

## Current Implementation

### BaseProcessor (Abstract Base Class)
```typescript
export abstract class BaseProcessor {
  protected nextProcessor?: BaseProcessor;

  setNext(processor: BaseProcessor): BaseProcessor {
    this.nextProcessor = processor;
    return processor;
  }

  process(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[] {
    const result = this.handleProcess(overlays, context);
    
    if (this.nextProcessor) {
      return this.nextProcessor.process(result, context);
    }
    
    return result;
  }

  protected abstract handleProcess(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[];
}

export interface ProcessingContext {
  videoHeight: number;
  videoWidth?: number;
}
```

### FontPathProcessor
```typescript
export class FontPathProcessor extends BaseProcessor {
  protected handleProcess(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[] {
    return overlays.map(overlay => {
      let fontPath: string;
      let fontInstance: any = null;

      if (typeof overlay.fontFamily === "string") {
        fontPath = overlay.fontFamily;
      } else {
        fontInstance = overlay.fontFamily;
        fontPath = fontInstance.getFullPath();
      }

      return { ...overlay, fontPath, fontInstance };
    });
  }
}
```

### MultiLineProcessor
```typescript
export class MultiLineProcessor extends BaseProcessor {
  protected handleProcess(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[] {
    const result: TextOverlay[] = [];
    
    for (const overlay of overlays) {
      const expandedOverlays = this.parseMultiLineText(overlay, context.videoHeight);
      result.push(...expandedOverlays);
    }
    
    return result;
  }
  
  // ... implementation details
}
```

## Adding a New Processor

To add a new processor (e.g., for animation timing optimization), follow this pattern:

```typescript
// AnimationTimingProcessor.ts
export class AnimationTimingProcessor extends BaseProcessor {
  protected handleProcess(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[] {
    return overlays.map(overlay => {
      if (!overlay.animation?.enabled) {
        return overlay;
      }

      // Optimize animation timing based on overlay duration
      const overlayDuration = overlay.endTime - overlay.startTime;
      const optimizedAnimation = this.optimizeAnimationTiming(
        overlay.animation, 
        overlayDuration
      );

      return {
        ...overlay,
        animation: optimizedAnimation
      };
    });
  }

  private optimizeAnimationTiming(animation: Animation, overlayDuration: number): Animation {
    // Don't let animation duration exceed 50% of overlay duration
    const maxAnimationDuration = overlayDuration * 0.5;
    const optimizedDuration = Math.min(animation.duration, maxAnimationDuration);

    // Add delay if animation is too short for the overlay
    let delay = animation.delay || 0;
    if (optimizedDuration < overlayDuration * 0.1) {
      // If animation is less than 10% of overlay duration, add a delay
      delay = Math.max(delay, overlayDuration * 0.2);
    }

    return {
      ...animation,
      duration: optimizedDuration,
      delay: delay
    };
  }

  // Additional optimization methods
  private calculateOptimalFadeInDuration(overlayDuration: number): number {
    // Fade-in should be 10-30% of total duration, with limits
    const percentage = Math.min(0.3, Math.max(0.1, 2 / overlayDuration));
    return overlayDuration * percentage;
  }

  private calculateOptimalSlideDistance(
    videoDimensions: { width: number; height: number }, 
    position: Position
  ): number {
    // Calculate slide distance based on video size and position
    const baseDistance = Math.min(videoDimensions.width, videoDimensions.height) * 0.1;
    return baseDistance;
  }
}
```

## Another Processor Example: PositionOptimizationProcessor

```typescript
// PositionOptimizationProcessor.ts
export class PositionOptimizationProcessor extends BaseProcessor {
  protected handleProcess(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[] {
    // Group overlays by timing to detect overlaps
    const timeGroups = this.groupOverlapsByTiming(overlays);
    
    return overlays.map(overlay => {
      const overlappingOverlays = this.findOverlappingOverlays(overlay, overlays);
      
      if (overlappingOverlays.length > 1) {
        // Adjust position to avoid collisions
        const optimizedPosition = this.resolvePositionCollision(
          overlay, 
          overlappingOverlays, 
          context
        );
        
        return {
          ...overlay,
          position: optimizedPosition,
          _positionOptimized: true
        };
      }
      
      return overlay;
    });
  }

  private groupOverlapsByTiming(overlays: TextOverlay[]): TextOverlay[][] {
    const groups: TextOverlay[][] = [];
    
    for (const overlay of overlays) {
      let addedToGroup = false;
      
      for (const group of groups) {
        if (this.hasTimingOverlap(overlay, group[0])) {
          group.push(overlay);
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        groups.push([overlay]);
      }
    }
    
    return groups;
  }

  private hasTimingOverlap(overlay1: TextOverlay, overlay2: TextOverlay): boolean {
    return !(overlay1.endTime <= overlay2.startTime || overlay2.endTime <= overlay1.startTime);
  }

  private findOverlappingOverlays(target: TextOverlay, allOverlays: TextOverlay[]): TextOverlay[] {
    return allOverlays.filter(overlay => 
      overlay !== target && this.hasTimingOverlap(target, overlay)
    );
  }

  private resolvePositionCollision(
    overlay: TextOverlay, 
    overlappingOverlays: TextOverlay[], 
    context: ProcessingContext
  ): Position {
    // Simple collision resolution: stack overlays vertically
    const basePosition = overlay.position;
    const collisionIndex = overlappingOverlays.indexOf(overlay);
    
    if (typeof basePosition === 'object' && basePosition.y) {
      let yOffset = 0;
      
      if (typeof basePosition.y === 'string' && basePosition.y.includes('%')) {
        const percentage = parseFloat(basePosition.y.replace('%', ''));
        yOffset = collisionIndex * 10; // 10% offset per collision
        const newPercentage = Math.min(90, percentage + yOffset);
        
        return {
          ...basePosition,
          y: `${newPercentage}%`
        };
      } else if (typeof basePosition.y === 'number') {
        yOffset = collisionIndex * (context.videoHeight * 0.1); // 10% of video height
        
        return {
          ...basePosition,
          y: basePosition.y + yOffset
        };
      }
    }
    
    return basePosition;
  }

  // Utility methods for position calculations
  private calculateTextBounds(
    overlay: TextOverlay, 
    context: ProcessingContext
  ): { x: number; y: number; width: number; height: number } {
    // Estimate text bounds based on font size and text length
    const fontSize = overlay.fontSize <= 20 
      ? (overlay.fontSize / 100) * context.videoHeight
      : overlay.fontSize;
    
    const lines = overlay.text.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    
    // Rough estimation of text dimensions
    const charWidth = fontSize * 0.6; // Approximate character width
    const lineHeight = fontSize * 1.2; // Standard line height
    
    const textWidth = maxLineLength * charWidth;
    const textHeight = lines.length * lineHeight;
    
    // Calculate actual position
    const position = this.resolvePosition(overlay.position, context);
    
    return {
      x: position.x - textWidth / 2, // Assuming center alignment
      y: position.y - textHeight / 2,
      width: textWidth,
      height: textHeight
    };
  }

  private resolvePosition(
    position: Position, 
    context: ProcessingContext
  ): { x: number; y: number } {
    if (typeof position === 'object') {
      let x = 0, y = 0;
      
      if (typeof position.x === 'string' && position.x.includes('%')) {
        x = (parseFloat(position.x.replace('%', '')) / 100) * (context.videoWidth || 1920);
      } else if (typeof position.x === 'number') {
        x = position.x;
      }
      
      if (typeof position.y === 'string' && position.y.includes('%')) {
        y = (parseFloat(position.y.replace('%', '')) / 100) * context.videoHeight;
      } else if (typeof position.y === 'number') {
        y = position.y;
      }
      
      return { x, y };
    }
    
    // Handle preset positions like 'center', 'top-left', etc.
    return this.resolvePresetPosition(position, context);
  }

  private resolvePresetPosition(
    preset: string, 
    context: ProcessingContext
  ): { x: number; y: number } {
    const width = context.videoWidth || 1920;
    const height = context.videoHeight;
    
    switch (preset) {
      case 'center': return { x: width / 2, y: height / 2 };
      case 'top-left': return { x: width * 0.1, y: height * 0.1 };
      case 'top-right': return { x: width * 0.9, y: height * 0.1 };
      case 'bottom-left': return { x: width * 0.1, y: height * 0.9 };
      case 'bottom-right': return { x: width * 0.9, y: height * 0.9 };
      default: return { x: width / 2, y: height / 2 };
    }
  }
}
```

## Usage in Core Application

```typescript
// In VideoTextApplication.ts
private processOverlays(videoDimensions: VideoDimensions) {
  const context: ProcessingContext = {
    videoHeight: videoDimensions.height,
    videoWidth: videoDimensions.width,
  };

  // Create processing chain
  const fontProcessor = new FontPathProcessor();
  const multiLineProcessor = new MultiLineProcessor();
  const animationProcessor = new AnimationTimingProcessor();
  const positionProcessor = new PositionOptimizationProcessor();
  
  // Chain the processors
  fontProcessor
    .setNext(multiLineProcessor)
    .setNext(animationProcessor)
    .setNext(positionProcessor);

  // Process overlays through the chain
  return fontProcessor.process(this.config.textOverlays, context);
}
```

## Benefits of This Architecture

1. **Modularity**: Each processor handles one specific concern
2. **Flexibility**: Processors can be easily added, removed, or reordered
3. **Testability**: Each processor can be unit tested independently
4. **Extensibility**: New processing logic can be added without modifying existing code
5. **Maintainability**: Changes to one processor don't affect others

## Testing Example

```typescript
// AnimationTimingProcessor.test.ts
import { AnimationTimingProcessor } from './AnimationTimingProcessor';

describe('AnimationTimingProcessor', () => {
  it('should optimize animation duration for short overlays', () => {
    const processor = new AnimationTimingProcessor();
    const overlays = [{
      text: 'Test',
      startTime: 0,
      endTime: 2, // 2 second overlay
      animation: {
        enabled: true,
        type: new Effect_FadeIn(),
        duration: 1.5 // 75% of overlay duration
      }
      // ... other properties
    }];

    const result = processor.process(overlays, { videoHeight: 1080 });
    
    expect(result[0].animation.duration).toBeLessThanOrEqual(1.0); // Should be ≤ 50% of overlay duration
  });
});
```
