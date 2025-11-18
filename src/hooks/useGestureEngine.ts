import { useEffect, useRef, useState } from "react";
import { GestureEvent, GestureFrameState, HandPose } from "../types/gestures";
import {
  getPinchMetrics,
  getTwoFingerMetrics,
  isOpenPalm,
  isPinching,
  isPointing,
  isTapGesture,
  isTwoFingerPinch,
  PinchHistoryEntry
} from "../three/gestures";

const emptyState: GestureFrameState = {
  hand: null,
  isPinching: false,
  isOpenPalm: false,
  isPointing: false,
  isTwoFingerPinch: false,
  pinchStrength: 0,
  pinchDistance: 0,
  pinchNormalized: 0,
  twoFingerDistance: 0,
  twoFingerNormalized: 0,
  events: [],
  updatedAt: 0
};

const maxHistory = 12;
const tapCooldownMs = 260;

export const useGestureEngine = (hand: HandPose | null, enabled: boolean) => {
  const pinchHistoryRef = useRef<PinchHistoryEntry[]>([]);
  const lastTapRef = useRef<number>(0);
  const previousStateRef = useRef({
    isPinching: false,
    isPointing: false,
    isTwoFingerPinch: false,
    isOpenPalm: false
  });
  const [frameState, setFrameState] = useState<GestureFrameState>(emptyState);

  useEffect(() => {
    const timestamp = performance.now();
    if (!enabled || !hand) {
      pinchHistoryRef.current = [];
      previousStateRef.current = {
        isPinching: false,
        isPointing: false,
        isTwoFingerPinch: false,
        isOpenPalm: false
      };
      setFrameState({ ...emptyState, updatedAt: timestamp });
      return;
    }

    const pinchMetrics = getPinchMetrics(hand);
    const openPalm = isOpenPalm(hand);
    const pinching = isPinching(hand);
    const pointing = isPointing(hand);
    const twoFingerPinch = isTwoFingerPinch(hand);
    const twoFingerMetrics = getTwoFingerMetrics(hand);

    pinchHistoryRef.current = [...pinchHistoryRef.current, { state: pinching, timestamp }].slice(-maxHistory);

    const events: GestureEvent[] = [];
    const prev = previousStateRef.current;

    if (!prev.isPinching && pinching) {
      events.push({ type: "pinch-start", hand, timestamp });
    } else if (prev.isPinching && !pinching) {
      events.push({ type: "pinch-end", hand, timestamp });
    }

    if (!prev.isPointing && pointing) {
      events.push({ type: "point-start", hand, timestamp });
    } else if (prev.isPointing && !pointing) {
      events.push({ type: "point-end", hand, timestamp });
    }

    if (!prev.isTwoFingerPinch && twoFingerPinch) {
      events.push({ type: "two-finger-pinch-start", hand, timestamp });
    } else if (prev.isTwoFingerPinch && !twoFingerPinch) {
      events.push({ type: "two-finger-pinch-end", hand, timestamp });
    }

    if (!prev.isOpenPalm && openPalm) {
      events.push({ type: "open-palm", hand, timestamp });
    }

    const tapReady = timestamp - lastTapRef.current > tapCooldownMs;
    if (tapReady && isTapGesture(pinchHistoryRef.current)) {
      events.push({ type: "tap", hand, timestamp });
      lastTapRef.current = timestamp;
    }

    previousStateRef.current = { isPinching: pinching, isPointing: pointing, isTwoFingerPinch: twoFingerPinch, isOpenPalm: openPalm };

    setFrameState({
      hand,
      isPinching: pinching,
      isOpenPalm: openPalm,
      isPointing: pointing,
      isTwoFingerPinch: twoFingerPinch,
      pinchStrength: pinchMetrics.pinchStrength,
      pinchDistance: pinchMetrics.pinchDistance,
      pinchNormalized: pinchMetrics.normalizedPinch,
      twoFingerDistance: twoFingerMetrics.absolute,
      twoFingerNormalized: twoFingerMetrics.normalized,
      events,
      updatedAt: timestamp
    });
  }, [enabled, hand]);

  return frameState;
};
