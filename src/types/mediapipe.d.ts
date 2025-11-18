declare module "@mediapipe/hands" {
  export interface HandsConfig {
    locateFile?: (path: string) => string;
    maxNumHands?: number;
    modelComplexity?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
  }

  export interface Handedness {
    label: "Left" | "Right";
  }

  export interface HandsResults {
    image: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | null;
    multiHandLandmarks: NormalizedLandmark[][];
    multiHandedness: Handedness[];
  }

  export class Hands {
    constructor(options: HandsConfig);
    onResults(listener: (results: HandsResults) => void): void;
    send(options: { image: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement }): Promise<void>;
    close(): Promise<void>;
  }
}

declare module "@mediapipe/camera_utils" {
  interface CameraOptions {
    onFrame: () => Promise<void>;
    width?: number;
    height?: number;
  }

  export class Camera {
    constructor(video: HTMLVideoElement, options: CameraOptions);
    start(): Promise<void>;
    stop(): Promise<void>;
  }
}
