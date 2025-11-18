import { useCallback, useEffect, useRef, useState } from "react";
import { Hands, HandsResults } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { HandPose } from "../types/gestures";

const assetBase = "/mediapipe/";

const assetMap: Record<string, string> = {
  "hands_solution_simd_wasm_bin.wasm": `${assetBase}hands_solution_simd_wasm_bin.wasm`,
  "hands_solution_simd_wasm_bin.js": `${assetBase}hands_solution_simd_wasm_bin.js`,
  "hands_solution_packed_assets_loader.js": `${assetBase}hands_solution_packed_assets_loader.js`,
  "hands_solution_packed_assets.data": `${assetBase}hands_solution_packed_assets.data`,
  "hand_landmark_full.tflite": `${assetBase}hand_landmark_full.tflite`,
  "hand_landmark_lite.tflite": `${assetBase}hand_landmark_lite.tflite`
};

export const useHandTracking = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const [handPose, setHandPose] = useState<HandPose | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => assetMap[file] ?? assetMap[file.split("/").pop() ?? ""] ?? file,
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    });
    handsRef.current = hands;
    hands.onResults((results: HandsResults) => {
      if (!results.multiHandLandmarks.length || !results.multiHandedness.length) {
        setHandPose(null);
        return;
      }
      const landmarks = results.multiHandLandmarks[0];
      const handedness = results.multiHandedness[0];
      const video = videoRef.current;
      const imageWidth = video ? video.videoWidth : 0;
      const imageHeight = video ? video.videoHeight : 0;
      const pose: HandPose = {
        id: 0,
        handedness: handedness.label === "Left" ? "Left" : "Right",
        landmarks,
        timestamp: performance.now(),
        imageWidth,
        imageHeight
      };
      setHandPose(pose);
    });
    setIsReady(true);
    return () => {
      hands.close();
      handsRef.current = null;
    };
  }, []);

  const stopTracking = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    setIsTracking(false);
    setHandPose(null);
  }, []);

  const startTracking = useCallback(async () => {
    if (!isReady || isTracking) {
      return;
    }
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const hands = handsRef.current;
    if (!hands) {
      return;
    }
    const camera = new Camera(video, {
      width: 640,
      height: 480,
      onFrame: async () => {
        if (handsRef.current) {
          await handsRef.current.send({ image: video });
        }
      }
    });
    cameraRef.current = camera;
    await camera.start();
    setIsTracking(true);
  }, [isReady, isTracking]);

  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    handPose,
    isReady,
    isTracking,
    startTracking,
    stopTracking
  };
};
