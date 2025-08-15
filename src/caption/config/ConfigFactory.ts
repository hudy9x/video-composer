import { Config } from '../type';
import { Fonts_DMSerifDisplayItalic, Fonts_DMSerifDisplayRegular } from '../fonts';
import { Effect_FadeIn, Effect_SlideDown } from '../effects';

export class ConfigFactory {
  static createDefaultConfig(): Config {
    return {
      textOverlays: [
        {
          text: "ChatGPT\nprompt for\nimages",
          textElements: [
            {
              text: "ChatGPT",
              line: 0,
            },
            {
              text: "prompt for",
              line: 1,
            },
            {
              text: "images",
              line: 2,
              fontSize: 8,
              fontColor: "gold",
              textOutline: { enabled: true, color: "red", width: 4 },
              textShadow: {
                enabled: true,
                color: "purple",
                offsetX: 3,
                offsetY: 3,
              },
              animation: {
                enabled: true,
                type: new Effect_FadeIn(),
                duration: 1.0,
              },
              startTime: 5,
              endTime: 9,
            },
          ],
          startTime: 2,
          endTime: 7,
          fontSize: 6,
          fontFamily: new Fonts_DMSerifDisplayItalic(),
          fontColor: "white",
          position: { x: "50%", y: "50%" },
          textAlign: "center",
          textOutline: {
            enabled: true,
            color: "black",
            width: 3,
          },
          textShadow: {
            enabled: true,
            color: "black",
            offsetX: 2,
            offsetY: 2,
          },
          textBox: {
            enabled: false,
            color: "black@0.5",
            padding: 10,
          },
          animation: {
            enabled: true,
            type: new Effect_FadeIn(),
            duration: 0.5,
          },
        },
        {
          text: "I am a\nsoftware engineer",
          startTime: 10,
          endTime: 14,
          fontSize: 5,
          fontFamily: new Fonts_DMSerifDisplayRegular(),
          fontColor: "white",
          position: { x: "50%", y: "50%" },
          textAlign: "center",
          textOutline: {
            enabled: true,
            color: "black",
            width: 3,
          },
          textShadow: {
            enabled: true,
            color: "black",
            offsetX: 2,
            offsetY: 2,
          },
          textBox: {
            enabled: false,
            color: "black@0.5",
            padding: 10,
          },
          animation: {
            enabled: true,
            type: new Effect_SlideDown(),
            duration: 0.8,
          },
        },
      ],
    };
  }

  static loadFromFile(configPath: string): Config {
    // Future: Load configuration from JSON file
    // For now, return default
    return this.createDefaultConfig();
  }
}
