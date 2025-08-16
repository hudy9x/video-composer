import { Config } from "@/caption/type";
import {
  DM_SERIF_DISPLAY_ITALIC_TYPE,
  DM_SERIF_DISPLAY_REGULAR_TYPE,
} from "@/caption/fonts";

const sampleConfig: Config = {
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
            type: "fade-in",
            duration: 1.0,
          },
          startTime: 5,
          endTime: 9,
        },
      ],
      startTime: 2,
      endTime: 7,
      fontSize: 6,
      fontFamily: DM_SERIF_DISPLAY_ITALIC_TYPE,
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
        type: "fade-in",
        duration: 0.5,
      },
    },
    {
      text: "I am a\nsoftware engineer",
      startTime: 10,
      endTime: 14,
      fontSize: 5,
      fontFamily: DM_SERIF_DISPLAY_REGULAR_TYPE,
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
        type: "slide-down",
        duration: 0.8,
      },
    },
  ],
};

// Hardcoded subtitle config based on transcription data
export const subtitleConfig: Config = {
  textOverlays: [
    {
      text: "Hello World,",
      textElements: [
        {
          text: "Hello World,",
          line: 0,
        },
      ],
      startTime: 0,
      endTime: 1.36,
      fontSize: 4,
      fontFamily: DM_SERIF_DISPLAY_REGULAR_TYPE,
      fontColor: "white",
      position: { x: "50%", y: "50%" },
      textAlign: "center",
      textOutline: {
        enabled: true,
        color: "black",
        width: 2,
      },
      textShadow: {
        enabled: true,
        color: "black",
        offsetX: 1,
        offsetY: 1,
      },
      textBox: {
        enabled: false,
        color: "black@0.7",
        padding: 8,
      },
      animation: {
        enabled: true,
        type: "fade-in",
        duration: 0.3,
      },
    },
    {
      text: "It is Sunday,",
      startTime: 1.36,
      endTime: 2.72,
      fontSize: 4,
      fontFamily: DM_SERIF_DISPLAY_REGULAR_TYPE,
      fontColor: "white",
      position: { x: "50%", y: "50%" },
      textAlign: "center",
      textOutline: {
        enabled: true,
        color: "black",
        width: 2,
      },
      textShadow: {
        enabled: true,
        color: "black",
        offsetX: 1,
        offsetY: 1,
      },
      textBox: {
        enabled: false,
        color: "black@0.7",
        padding: 8,
      },
      animation: {
        enabled: true,
        type: "fade-in",
        duration: 0.3,
      },
    },
    {
      text: "July 20th,",
      startTime: 2.72,
      endTime: 4.08,
      fontSize: 4,
      fontFamily: DM_SERIF_DISPLAY_REGULAR_TYPE,
      fontColor: "white",
      position: { x: "50%", y: "50%" },
      textAlign: "center",
      textOutline: {
        enabled: true,
        color: "black",
        width: 2,
      },
      textShadow: {
        enabled: true,
        color: "black",
        offsetX: 1,
        offsetY: 1,
      },
      textBox: {
        enabled: false,
        color: "black@0.7",
        padding: 8,
      },
      animation: {
        enabled: true,
        type: "fade-in",
        duration: 0.3,
      },
    },
    {
      text: "and I",
      startTime: 4.08,
      endTime: 5.44,
      fontSize: 4,
      fontFamily: DM_SERIF_DISPLAY_REGULAR_TYPE,
      fontColor: "white",
      position: { x: "50%", y: "50%" },
      textAlign: "center",
      textOutline: {
        enabled: true,
        color: "black",
        width: 2,
      },
      textShadow: {
        enabled: true,
        color: "black",
        offsetX: 1,
        offsetY: 1,
      },
      textBox: {
        enabled: false,
        color: "black@0.7",
        padding: 8,
      },
      animation: {
        enabled: true,
        type: "fade-in",
        duration: 0.3,
      },
    },
    {
      text: "am Heudi,",
      startTime: 5.44,
      endTime: 6.8,
      fontSize: 4,
      fontFamily: DM_SERIF_DISPLAY_REGULAR_TYPE,
      fontColor: "white",
      position: { x: "50%", y: "50%" },
      textAlign: "center",
      textOutline: {
        enabled: true,
        color: "black",
        width: 2,
      },
      textShadow: {
        enabled: true,
        color: "black",
        offsetX: 1,
        offsetY: 1,
      },
      textBox: {
        enabled: false,
        color: "black@0.7",
        padding: 8,
      },
      animation: {
        enabled: true,
        type: "fade-in",
        duration: 0.3,
      },
    },
    {
      text: "a web",
      startTime: 6.8,
      endTime: 8.16,
      fontSize: 4,
      fontFamily: DM_SERIF_DISPLAY_ITALIC_TYPE,
      fontColor: "white",
      position: { x: "50%", y: "50%" },
      textAlign: "center",
      textOutline: {
        enabled: true,
        color: "black",
        width: 2,
      },
      textShadow: {
        enabled: true,
        color: "black",
        offsetX: 1,
        offsetY: 1,
      },
      textBox: {
        enabled: true,
        color: "black@0.7",
        padding: 8,
      },
      animation: {
        enabled: true,
        type: "fade-in",
        duration: 0.3,
      },
    },
    {
      text: "developer.",
      startTime: 8.16,
      endTime: 9.52,
      fontSize: 4,
      fontFamily: DM_SERIF_DISPLAY_REGULAR_TYPE,
      fontColor: "white",
      position: { x: "50%", y: "50%" },
      textAlign: "center",
      textOutline: {
        enabled: true,
        color: "black",
        width: 2,
      },
      textShadow: {
        enabled: true,
        color: "black",
        offsetX: 1,
        offsetY: 1,
      },
      textBox: {
        enabled: false,
        color: "black@0.7",
        padding: 8,
      },
      animation: {
        enabled: true,
        type: "fade-in",
        duration: 0.3,
      },
    },
  ],
};

export function loadConfigFromFile(configPath: string): Config {
  // Future: Load configuration from JSON file
  // For now, return default
  return defaultConfig;
}

export const defaultConfig: Config = subtitleConfig;
