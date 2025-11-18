declare type XRHandedness = "none" | "left" | "right";

declare type XRHandJoint =
  | "wrist"
  | "thumb-metacarpal"
  | "thumb-phalanx-proximal"
  | "thumb-phalanx-distal"
  | "thumb-tip"
  | "index-finger-metacarpal"
  | "index-finger-phalanx-proximal"
  | "index-finger-phalanx-intermediate"
  | "index-finger-phalanx-distal"
  | "index-finger-tip"
  | "middle-finger-metacarpal"
  | "middle-finger-phalanx-proximal"
  | "middle-finger-phalanx-intermediate"
  | "middle-finger-phalanx-distal"
  | "middle-finger-tip"
  | "ring-finger-metacarpal"
  | "ring-finger-phalanx-proximal"
  | "ring-finger-phalanx-intermediate"
  | "ring-finger-phalanx-distal"
  | "ring-finger-tip"
  | "pinky-finger-metacarpal"
  | "pinky-finger-phalanx-proximal"
  | "pinky-finger-phalanx-intermediate"
  | "pinky-finger-phalanx-distal"
  | "pinky-finger-tip";

declare interface XRJointPose extends XRPose {
  readonly radius?: number;
}

declare interface XRHand extends Iterable<[XRHandJoint, XRJointSpace]> {
  readonly size: number;
  entries(): IterableIterator<[XRHandJoint, XRJointSpace]>;
  keys(): IterableIterator<XRHandJoint>;
  values(): IterableIterator<XRJointSpace>;
  forEach(callbackfn: (value: XRJointSpace, key: XRHandJoint, map: XRHand) => void, thisArg?: unknown): void;
  get(key: XRHandJoint): XRJointSpace;
  has(key: XRHandJoint): boolean;
}

declare interface XRInputSource {
  hand?: XRHand;
  handedness: XRHandedness;
}

declare interface XRFrame {
  readonly session: XRSession;
  getJointPose(space: XRJointSpace, baseSpace: XRSpace): XRJointPose | null;
}
