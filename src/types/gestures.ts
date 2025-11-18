export type Handedness = "Left" | "Right";

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandPose {
  id: number;
  handedness: Handedness;
  landmarks: HandLandmark[];
  timestamp: number;
  imageWidth: number;
  imageHeight: number;
}

export type GestureEventType =
  | "pinch-start"
  | "pinch-end"
  | "open-palm"
  | "point-start"
  | "point-end"
  | "two-finger-pinch-start"
  | "two-finger-pinch-end"
  | "tap";

export interface GestureEvent {
  type: GestureEventType;
  hand: HandPose;
  timestamp: number;
}

export interface GestureFrameState {
  hand: HandPose | null;
  isPinching: boolean;
  isOpenPalm: boolean;
  isPointing: boolean;
  isTwoFingerPinch: boolean;
  pinchStrength: number;
  pinchDistance: number;
  pinchNormalized: number;
  twoFingerDistance: number;
  twoFingerNormalized: number;
  events: GestureEvent[];
  updatedAt: number;
}
