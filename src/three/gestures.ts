import { HandPose, GestureEventType } from "../types/gestures";

const distance = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.hypot(dx, dy, dz);
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getHandScale = (hand: HandPose) => {
  const wrist = hand.landmarks[0];
  const indexBase = hand.landmarks[5];
  const middleBase = hand.landmarks[9];
  const span = (distance(wrist, indexBase) + distance(wrist, middleBase)) * 0.5;
  return Math.max(span, 0.001);
};

const fingerExtended = (hand: HandPose, indices: [number, number, number, number]) => {
  const [mcp, pip, dip, tip] = indices;
  const mcpPoint = hand.landmarks[mcp];
  const pipPoint = hand.landmarks[pip];
  const dipPoint = hand.landmarks[dip];
  const tipPoint = hand.landmarks[tip];
  return tipPoint.y < pipPoint.y && dipPoint.y < pipPoint.y && pipPoint.y < mcpPoint.y;
};

export const getPinchMetrics = (hand: HandPose) => {
  const thumbTip = hand.landmarks[4];
  const indexTip = hand.landmarks[8];
  const pinchDistance = distance(thumbTip, indexTip);
  const scale = getHandScale(hand);
  const normalized = pinchDistance / scale;
  const strength = clamp(1 - normalized / 0.4, 0, 1);
  return { pinchDistance, normalizedPinch: normalized, pinchStrength: strength };
};

export const isPinching = (hand: HandPose) => {
  const { normalizedPinch } = getPinchMetrics(hand);
  return normalizedPinch < 0.35;
};

export const isTwoFingerPinch = (hand: HandPose) => {
  const indexTip = hand.landmarks[8];
  const middleTip = hand.landmarks[12];
  const scale = getHandScale(hand);
  return distance(indexTip, middleTip) / scale < 0.3;
};

export const getTwoFingerMetrics = (hand: HandPose) => {
  const indexTip = hand.landmarks[8];
  const middleTip = hand.landmarks[12];
  const absolute = distance(indexTip, middleTip);
  const normalized = absolute / getHandScale(hand);
  return { absolute, normalized };
};

export const isOpenPalm = (hand: HandPose) => {
  const digits = [
    fingerExtended(hand, [5, 6, 7, 8]),
    fingerExtended(hand, [9, 10, 11, 12]),
    fingerExtended(hand, [13, 14, 15, 16]),
    fingerExtended(hand, [17, 18, 19, 20])
  ];
  const thumbTip = hand.landmarks[4];
  const wrist = hand.landmarks[0];
  const thumbExtended = thumbTip.x < wrist.x ? hand.handedness === "Right" : hand.handedness === "Left";
  const extendedCount = digits.filter(Boolean).length + (thumbExtended ? 1 : 0);
  return extendedCount >= 4;
};

export const isPointing = (hand: HandPose) => {
  const indexExtended = fingerExtended(hand, [5, 6, 7, 8]);
  const middleExtended = fingerExtended(hand, [9, 10, 11, 12]);
  const ringExtended = fingerExtended(hand, [13, 14, 15, 16]);
  const pinkyExtended = fingerExtended(hand, [17, 18, 19, 20]);
  return indexExtended && !middleExtended && !ringExtended && !pinkyExtended;
};

export interface PinchHistoryEntry {
  state: boolean;
  timestamp: number;
}

export const isTapGesture = (history: PinchHistoryEntry[], maxInterval = 220) => {
  if (history.length < 2) {
    return false;
  }
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  return prev.state && !last.state && last.timestamp - prev.timestamp <= maxInterval;
};

export const getGestureTransitionEvent = (
  current: boolean,
  previous: boolean,
  type: GestureEventType,
  timestamp: number
) => {
  if (current === previous) {
    return null;
  }
  const phase: GestureEventType = current ? (type as GestureEventType) : (type.replace("-start", "-end") as GestureEventType);
  return { type: phase, timestamp };
};
