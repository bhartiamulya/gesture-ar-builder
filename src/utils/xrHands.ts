import { Vector3 } from "three";
import { HandPose } from "../types/gestures";

const jointOrder: XRHandJoint[] = [
  "wrist",
  "thumb-metacarpal",
  "thumb-phalanx-proximal",
  "thumb-phalanx-distal",
  "thumb-tip",
  "index-finger-metacarpal",
  "index-finger-phalanx-proximal",
  "index-finger-phalanx-intermediate",
  "index-finger-phalanx-distal",
  "index-finger-tip",
  "middle-finger-metacarpal",
  "middle-finger-phalanx-proximal",
  "middle-finger-phalanx-intermediate",
  "middle-finger-phalanx-distal",
  "middle-finger-tip",
  "ring-finger-metacarpal",
  "ring-finger-phalanx-proximal",
  "ring-finger-phalanx-intermediate",
  "ring-finger-phalanx-distal",
  "ring-finger-tip",
  "pinky-finger-metacarpal",
  "pinky-finger-phalanx-proximal",
  "pinky-finger-phalanx-intermediate",
  "pinky-finger-phalanx-distal",
  "pinky-finger-tip"
];

const scratch = {
  wrist: new Vector3(),
  indexBase: new Vector3(),
  middleTip: new Vector3(),
  palmDirection: new Vector3(),
  localX: new Vector3(),
  localY: new Vector3(),
  localZ: new Vector3(),
  relative: new Vector3()
};

const ensureNormal = (vector: Vector3, fallback: Vector3) => {
  if (!isFinite(vector.x) || !isFinite(vector.y) || !isFinite(vector.z) || vector.lengthSq() === 0) {
    vector.copy(fallback);
  }
  vector.normalize();
};

export const buildHandPoseFromXR = (
  frame: XRFrame,
  referenceSpace: XRReferenceSpace,
  hand: XRHand,
  handedness: XRHandedness
): HandPose | null => {
  if (typeof frame.getJointPose !== "function") {
    return null;
  }
  const positions: Vector3[] = [];
  for (const jointName of jointOrder) {
    const jointSpace = hand.get(jointName);
    if (!jointSpace) {
      return null;
    }
    const jointPose = frame.getJointPose(jointSpace, referenceSpace);
    if (!jointPose) {
      return null;
    }
    positions.push(new Vector3(jointPose.transform.position.x, jointPose.transform.position.y, jointPose.transform.position.z));
  }

  const wrist = positions[0];
  const indexBase = positions[5];
  const middleTip = positions[14];

  scratch.localY.subVectors(middleTip, wrist);
  ensureNormal(scratch.localY, new Vector3(0, 1, 0));

  scratch.localX.subVectors(indexBase, wrist);
  ensureNormal(scratch.localX, new Vector3(1, 0, 0));

  scratch.localZ.crossVectors(scratch.localX, scratch.localY);
  ensureNormal(scratch.localZ, new Vector3(0, 0, -1));

  scratch.localX.crossVectors(scratch.localY, scratch.localZ);
  ensureNormal(scratch.localX, new Vector3(1, 0, 0));

  const { localX, localY, localZ } = scratch;

  const landmarks = positions.map((worldPos) => {
    scratch.relative.subVectors(worldPos, wrist);
    const x = scratch.relative.dot(localX);
    const y = scratch.relative.dot(localY);
    const z = scratch.relative.dot(localZ);
    return { x, y, z };
  });

  const pose: HandPose = {
    id: 0,
    handedness: handedness === "left" ? "Left" : handedness === "right" ? "Right" : "Left",
    landmarks,
    timestamp: performance.now(),
    imageWidth: 1,
    imageHeight: 1
  };

  return pose;
};
