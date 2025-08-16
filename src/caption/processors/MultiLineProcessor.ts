import { BaseProcessor, ProcessingContext } from './BaseProcessor';
import { TextOverlay, TextElement } from '@/caption/type';

export class MultiLineProcessor extends BaseProcessor {
  protected handleProcess(overlays: TextOverlay[], context: ProcessingContext): TextOverlay[] {
    const result: TextOverlay[] = [];
    
    for (const overlay of overlays) {
      const expandedOverlays = this.parseMultiLineText(overlay, context.videoHeight);
      result.push(...expandedOverlays);
    }
    
    return result;
  }

  private parseMultiLineText(overlay: TextOverlay, videoHeight: number): TextOverlay[] {
    // Check if textElements is provided (new word-level styling)
    if (overlay.textElements && overlay.textElements.length > 0) {
      return this.parseTextElements(overlay, videoHeight);
    }

    // Fallback to original multi-line parsing
    const lines = overlay.text.split("\n");

    // If single line, return as-is
    if (lines.length === 1) {
      return [overlay];
    }

    // Calculate line spacing and total height
    const fontSize = this.calculateFontSize(overlay.fontSize, videoHeight);
    const lineSpacing = 1.2; // Standard line spacing multiplier
    const lineHeight = fontSize * lineSpacing;
    const totalHeight = lineHeight * lines.length;

    // Calculate starting Y position to center the entire text block
    const startingY = this.calculateStartingYForBlock(
      overlay.position.y,
      totalHeight,
      videoHeight
    );

    // Create separate overlay for each line
    return lines.map((line, index) => ({
      ...overlay,
      text: line.trim(), // Remove any extra whitespace
      position: {
        x: overlay.position.x,
        y: startingY + index * lineHeight,
      },
      // Pass through textAlign for positioning
      textAlign: overlay.textAlign || "center",
      // Add metadata for display purposes
      _isMultiLine: true,
      _originalText: overlay.text,
      _lineIndex: index,
      _totalLines: lines.length,
    }));
  }

  private parseTextElements(overlay: TextOverlay, videoHeight: number): TextOverlay[] {
    // Group elements by line to calculate line heights
    const lineGroups: { [key: number]: TextElement[] } = {};
    overlay.textElements!.forEach((element) => {
      if (!lineGroups[element.line]) {
        lineGroups[element.line] = [];
      }
      lineGroups[element.line].push(element);
    });

    // Calculate the maximum font size per line for proper spacing
    const lineHeights: { [key: number]: number } = {};
    const lineSpacing = 1.2;

    Object.keys(lineGroups).forEach((lineNumStr) => {
      const lineNum = parseInt(lineNumStr);
      const elements = lineGroups[lineNum];
      const maxFontSize = Math.max(
        ...elements.map((el) => {
          const fontSize =
            el.fontSize !== undefined ? el.fontSize : overlay.fontSize;
          return this.calculateFontSize(fontSize, videoHeight);
        })
      );
      lineHeights[lineNum] = maxFontSize * lineSpacing;
    });

    // Calculate total height of all lines
    const sortedLines = Object.keys(lineHeights).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );
    const totalHeight = sortedLines.reduce(
      (sum, lineNumStr) => sum + lineHeights[parseInt(lineNumStr)],
      0
    );

    // Calculate starting Y position
    const startingY = this.calculateStartingYForBlock(
      overlay.position.y,
      totalHeight,
      videoHeight
    );

    // Calculate Y position for each line
    const lineYPositions: { [key: number]: number } = {};
    let currentY = startingY;
    sortedLines.forEach((lineNumStr) => {
      const lineNum = parseInt(lineNumStr);
      lineYPositions[lineNum] = currentY;
      currentY += lineHeights[lineNum];
    });

    // Create overlay for each text element
    return overlay.textElements!.map((element, index) => {
      // Merge default overlay properties with element-specific overrides
      const mergedElement = {
        ...overlay, // Start with all default properties
        ...element, // Override with element-specific properties
        text: element.text, // Ensure text is from element
        position: {
          x: overlay.position.x,
          y: lineYPositions[element.line],
        },
        textAlign: element.textAlign || overlay.textAlign || "center",

        // Merge nested objects properly
        textOutline: {
          ...overlay.textOutline,
          ...(element.textOutline || {}),
        },
        textShadow: {
          ...overlay.textShadow,
          ...(element.textShadow || {}),
        },
        textBox: {
          ...overlay.textBox,
          ...(element.textBox || {}),
        },
        animation: {
          ...overlay.animation,
          ...(element.animation || {}),
        },

        // Add metadata
        _isTextElement: true,
        _originalText: overlay.text,
        _elementIndex: index,
        _totalElements: overlay.textElements!.length,
        _lineIndex: element.line,
      };

      return mergedElement;
    });
  }

  private calculateFontSize(fontSize: number, videoHeight: number): number {
    if (fontSize <= 20) {
      return Math.round((fontSize / 100) * videoHeight);
    } else {
      return fontSize;
    }
  }

  private calculateStartingYForBlock(
    originalY: string | number,
    totalHeight: number,
    videoHeight: number
  ): number {
    if (typeof originalY === "string" && originalY.includes("%")) {
      // Handle percentage positioning
      const percentage = parseFloat(originalY.replace("%", "")) / 100;
      const centerY = videoHeight * percentage;
      const startY = centerY - totalHeight / 2;
      return startY;
    } else if (
      typeof originalY === "number" ||
      (typeof originalY === "string" && !isNaN(parseFloat(originalY)))
    ) {
      // Handle fixed pixel positioning
      const centerY =
        typeof originalY === "number" ? originalY : parseFloat(originalY);
      const startY = centerY - totalHeight / 2;
      return startY;
    } else {
      // Fallback to center
      const centerY = videoHeight / 2;
      const startY = centerY - totalHeight / 2;
      return startY;
    }
  }
}
