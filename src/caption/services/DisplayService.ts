import { TextOverlay, Config, EffectType } from '../type';
import { VideoDimensions } from '../../lib/types';
import {
  FADE_IN_TYPE,
  FADE_OUT_TYPE,
  SLIDE_UP_TYPE,
  SLIDE_DOWN_TYPE,
  SLIDE_LEFT_TYPE,
  SLIDE_RIGHT_TYPE,
  ZOOM_IN_TYPE,
  ZOOM_OUT_TYPE
} from '../effects';
import { FontFactory } from '../fonts';

export class DisplayService {
  private static getEffectDisplayName(effectType: EffectType): string {
    switch (effectType) {
      case FADE_IN_TYPE:
        return 'Fade In';
      case FADE_OUT_TYPE:
        return 'Fade Out';
      case SLIDE_UP_TYPE:
        return 'Slide Up';
      case SLIDE_DOWN_TYPE:
        return 'Slide Down';
      case SLIDE_LEFT_TYPE:
        return 'Slide Left';
      case SLIDE_RIGHT_TYPE:
        return 'Slide Right';
      case ZOOM_IN_TYPE:
        return 'Zoom In';
      case ZOOM_OUT_TYPE:
        return 'Zoom Out';
      default:
        return 'Unknown Effect';
    }
  }
  static displayConfiguration(
    inputFile: string,
    outputFile: string,
    validatedOverlays: TextOverlay[],
    videoDimensions: VideoDimensions,
    config: Config
  ): void {
    console.log("Multi-Text Overlay Configuration:");
    console.log(
      `  Video resolution: ${videoDimensions.width}×${videoDimensions.height}`
    );
    console.log(`  Total overlays: ${validatedOverlays.length}`);
    console.log("");

    // Group overlays by their original text for better display
    const groupedOverlays = this.groupOverlays(validatedOverlays);

    Object.entries(groupedOverlays).forEach(([originalText, group]) => {
      this.displayOverlayGroup(originalText, group, videoDimensions, config);
    });

    console.log(`Input:  ${inputFile}`);
    console.log(`Output: ${outputFile}`);
    console.log("");
  }

  private static groupOverlays(validatedOverlays: TextOverlay[]) {
    const groupedOverlays: {
      [key: string]: {
        counter: number;
        overlays: TextOverlay[];
        isTextElements: boolean;
      };
    } = {};
    let overlayCounter = 1;

    validatedOverlays.forEach((overlay) => {
      if (overlay._isMultiLine || overlay._isTextElement) {
        // Multi-line text or text elements
        const originalText = overlay._originalText!;
        if (!groupedOverlays[originalText]) {
          groupedOverlays[originalText] = {
            counter: overlayCounter++,
            overlays: [],
            isTextElements: overlay._isTextElement || false,
          };
        }
        groupedOverlays[originalText].overlays.push(overlay);
      } else {
        // Single line text
        groupedOverlays[overlay.text] = {
          counter: overlayCounter++,
          overlays: [overlay],
          isTextElements: false,
        };
      }
    });

    return groupedOverlays;
  }

  private static displayOverlayGroup(
    originalText: string,
    group: { counter: number; overlays: TextOverlay[]; isTextElements: boolean },
    videoDimensions: VideoDimensions,
    config: Config
  ): void {
    const firstOverlay = group.overlays[0];

    console.log(`  Text ${group.counter}:`);

    if (group.isTextElements) {
      console.log(
        `    Text:        "${originalText}" (${group.overlays.length} text elements)`
      );
      group.overlays.forEach((overlay, index) => {
        const timing =
          overlay.startTime !== firstOverlay.startTime ||
          overlay.endTime !== firstOverlay.endTime
            ? ` (${overlay.startTime}s-${overlay.endTime}s)`
            : "";
        console.log(
          `      Element ${index + 1}: "${overlay.text}" on line ${
            overlay._lineIndex
          }${timing}`
        );
      });
    } else if (firstOverlay._isMultiLine) {
      console.log(
        `    Text:        "${originalText}" (${group.overlays.length} lines)`
      );
      group.overlays.forEach((overlay, index) => {
        console.log(`      Line ${index + 1}:   "${overlay.text}"`);
      });
    } else {
      console.log(`    Text:        "${originalText}"`);
    }

    console.log(
      `    Timing:      ${firstOverlay.startTime}s - ${firstOverlay.endTime}s`
    );
    const fontDisplay = firstOverlay.fontInstance
      ? firstOverlay.fontInstance.name
      : FontFactory.getFontDisplayName(firstOverlay.fontFamily);
    console.log(`    Font:        ${fontDisplay}`);

    // Display font size with calculation preview
    const actualFontSize =
      firstOverlay.fontSize <= 20
        ? Math.round((firstOverlay.fontSize / 100) * videoDimensions.height)
        : firstOverlay.fontSize;

    if (firstOverlay.fontSize <= 20) {
      console.log(
        `    Font Size:   ${firstOverlay.fontSize}% of video height → ${actualFontSize}px`
      );
    } else {
      console.log(`    Font Size:   ${firstOverlay.fontSize}px (fixed)`);
    }

    console.log(`    Text Align:  ${firstOverlay.textAlign || "center"}`);
    console.log(`    Color:       ${firstOverlay.fontColor}`);

    // Display position - show original for multi-line, actual for single line
    let positionDisplay;
    if (group.isTextElements || firstOverlay._isMultiLine) {
      // Show the original intended position
      const originalPosition = config.textOverlays.find(
        (o) => o.text === originalText
      )?.position;
      if (typeof originalPosition === "object") {
        positionDisplay = `x: ${originalPosition.x}, y: ${originalPosition.y} (auto-positioned)`;
      } else {
        positionDisplay = `${originalPosition} (auto-positioned)`;
      }
    } else {
      if (typeof firstOverlay.position === "object") {
        positionDisplay = `x: ${firstOverlay.position.x}, y: ${firstOverlay.position.y}`;
      } else {
        positionDisplay = firstOverlay.position;
      }
    }
    console.log(`    Position:    ${positionDisplay}`);

    console.log(
      `    Outline:     ${
        firstOverlay.textOutline.enabled
          ? `${firstOverlay.textOutline.color} (${firstOverlay.textOutline.width}px)`
          : "Disabled"
      }`
    );
    console.log(
      `    Shadow:      ${
        firstOverlay.textShadow.enabled
          ? `${firstOverlay.textShadow.color} (${firstOverlay.textShadow.offsetX}, ${firstOverlay.textShadow.offsetY})`
          : "Disabled"
      }`
    );
    console.log(
      `    Background:  ${
        firstOverlay.textBox.enabled ? firstOverlay.textBox.color : "Disabled"
      }`
    );
    const animationDisplay = firstOverlay.animation.enabled
      ? firstOverlay.animation.type
        ? this.getEffectDisplayName(firstOverlay.animation.type)
        : "Unknown Effect"
      : "Disabled";
    console.log(`    Animation:   ${animationDisplay}`);
    console.log("");
  }
}
