import { PerspectiveCamera, Vector3, Quaternion } from "three";
import { HandPose } from "../types/gestures";

const scratchVector = new Vector3();
const scratchDirection = new Vector3();
const scratchOrigin = new Vector3();

interface WorldPointResult {
  position: Vector3;
}

export const landmarkToWorld = (
  landmark: { x: number; y: number; z: number },
  camera: PerspectiveCamera,
  planeHeight: number,
  fallback: Vector3 | null = null
): WorldPointResult | null => {
  if (!camera.matrixWorldNeedsUpdate) {
    camera.updateMatrixWorld();
  }
  const ndcX = landmark.x * 2 - 1;
  const ndcY = 1 - landmark.y * 2;
  scratchVector.set(ndcX, ndcY, 0.5).unproject(camera);
  scratchOrigin.copy(camera.position);
  scratchDirection.copy(scratchVector).sub(scratchOrigin).normalize();
  const epsilon = 1e-5;
  if (Math.abs(scratchDirection.y) < epsilon) {
    if (!fallback) {
      return null;
    }
    return { position: fallback.clone() };
  }
  const distance = (planeHeight - scratchOrigin.y) / scratchDirection.y;
  if (!isFinite(distance) || distance < 0) {
    if (!fallback) {
      return null;
    }
    return { position: fallback.clone() };
  }
  const position = scratchOrigin.clone().add(scratchDirection.multiplyScalar(distance));
  return { position };
};

export const handDirection = (hand: HandPose, camera: PerspectiveCamera, planeHeight: number) => {
  const wrist = hand.landmarks[0];
  const indexTip = hand.landmarks[8];
  const wristResult = landmarkToWorld(wrist, camera, planeHeight);
  const tipResult = landmarkToWorld(indexTip, camera, planeHeight);
  if (!wristResult || !tipResult) {
    return null;
  }
  const direction = tipResult.position.clone().sub(wristResult.position);
  if (direction.lengthSq() === 0) {
    return null;
  }
  return direction.normalize();
};

export const createPoseFromReticle = (position: Vector3, orientation: Quaternion) => {
  return {
    position: position.clone(),
    orientation: orientation.clone()
  };
};
