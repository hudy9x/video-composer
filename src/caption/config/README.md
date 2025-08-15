# Configuration Management

## Purpose

The `config/` folder manages application configuration using the Factory pattern. It provides a centralized way to create and manage different configuration scenarios for the video caption system.

## Design Pattern: Factory Pattern

The Factory pattern is used to encapsulate the creation of configuration objects. This allows for:

- **Centralized Configuration**: All configuration logic is contained in one place
- **Multiple Configuration Sources**: Easy to add support for JSON files, environment variables, etc.
- **Default Configuration**: Provides sensible defaults out of the box
- **Type Safety**: Ensures configurations conform to the expected structure

## Current Implementation

```typescript
// ConfigFactory.ts
export class ConfigFactory {
  static createDefaultConfig(): Config {
    return {
      textOverlays: [
        {
          text: "ChatGPT\nprompt for\nimages",
          fontSize: 6,
          fontFamily: new Fonts_DMSerifDisplayItalic(),
          fontColor: "white",
          position: { x: "50%", y: "50%" },
          textAlign: "center",
          // ... more configuration
        }
      ]
    };
  }

  static loadFromFile(configPath: string): Config {
    // Future: Load configuration from JSON file
    return this.createDefaultConfig();
  }
}
```

## Adding a New Configuration Source

To add a new configuration method (e.g., loading from environment variables), follow this pattern:

```typescript
// Add to ConfigFactory.ts
export class ConfigFactory {
  // ... existing methods

  static createFromEnvironment(): Config {
    return {
      textOverlays: [
        {
          text: process.env.CAPTION_TEXT || "Default Text",
          fontSize: parseInt(process.env.CAPTION_FONT_SIZE || "6"),
          fontFamily: this.getFontFromEnv(process.env.CAPTION_FONT),
          fontColor: process.env.CAPTION_COLOR || "white",
          position: { 
            x: process.env.CAPTION_X || "50%", 
            y: process.env.CAPTION_Y || "50%" 
          },
          textAlign: process.env.CAPTION_ALIGN || "center",
          startTime: parseInt(process.env.CAPTION_START || "0"),
          endTime: parseInt(process.env.CAPTION_END || "10"),
          textOutline: {
            enabled: process.env.CAPTION_OUTLINE === "true",
            color: process.env.CAPTION_OUTLINE_COLOR || "black",
            width: parseInt(process.env.CAPTION_OUTLINE_WIDTH || "3")
          },
          textShadow: {
            enabled: process.env.CAPTION_SHADOW === "true",
            color: process.env.CAPTION_SHADOW_COLOR || "black",
            offsetX: parseInt(process.env.CAPTION_SHADOW_X || "2"),
            offsetY: parseInt(process.env.CAPTION_SHADOW_Y || "2")
          },
          textBox: {
            enabled: process.env.CAPTION_BOX === "true",
            color: process.env.CAPTION_BOX_COLOR || "black@0.5",
            padding: parseInt(process.env.CAPTION_BOX_PADDING || "10")
          },
          animation: {
            enabled: process.env.CAPTION_ANIMATION === "true",
            type: this.getEffectFromEnv(process.env.CAPTION_EFFECT),
            duration: parseFloat(process.env.CAPTION_DURATION || "0.5")
          }
        }
      ]
    };
  }

  private static getFontFromEnv(fontName?: string): any {
    switch (fontName) {
      case "italic": return new Fonts_DMSerifDisplayItalic();
      case "regular": return new Fonts_DMSerifDisplayRegular();
      case "archivo": return new Fonts_ArchivoBlack();
      default: return new Fonts_DMSerifDisplayItalic();
    }
  }

  private static getEffectFromEnv(effectName?: string): any {
    switch (effectName) {
      case "fade-in": return new Effect_FadeIn();
      case "fade-out": return new Effect_FadeOut();
      case "slide-up": return new Effect_SlideUp();
      case "slide-down": return new Effect_SlideDown();
      default: return new Effect_FadeIn();
    }
  }
}
```

## Usage Example

```typescript
// In VideoTextApplication or main application
const config = ConfigFactory.createFromEnvironment();
const app = new VideoTextApplication(config);
```
