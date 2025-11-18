import { useCallback, useEffect, useRef, useState } from "react";
import { Vector3, Quaternion } from "three";
import { UIControls } from "./components/UIControls";
import { ARCanvas } from "./components/ARCanvas";
import { useXR } from "./hooks/useXR";
import { useHandTracking } from "./hooks/useHandTracking";
import { useGestureEngine } from "./hooks/useGestureEngine";
import { useBlockManager } from "./hooks/useBlockManager";
import { BlockMaterialType, cycleMaterial, BlockEntity } from "./three/block";
import { createPoseFromReticle, handDirection, landmarkToWorld } from "./utils/space";
import { buildHandPoseFromXR } from "./utils/xrHands";
import { HandPose } from "./types/gestures";

const defaultScaleSession = { baseScale: 1, baseNormalized: 1 };

const App = () => {
  const {
    containerRef,
    isSupported,
    isSessionActive,
    enterAR,
    exitAR,
    addFrameListener,
    scene,
    camera,
    reticleVisible,
    reticlePosition,
    reticleQuaternion
  } = useXR();
  const { videoRef, handPose, isTracking, startTracking, stopTracking } = useHandTracking();
  const [xrHandPose, setXrHandPose] = useState<HandPose | null>(null);
  const [material, setMaterial] = useState<BlockMaterialType>("metal");
  const [hudVisible, setHudVisible] = useState(true);
  const gesturesActive = isSessionActive;
  const activeHandPose = xrHandPose ?? handPose;
  const gestureState = useGestureEngine(gesturesActive ? activeHandPose : null, gesturesActive);
  const {
    selected,
    blockCount,
    spawnBlock,
    moveSelected,
    deleteSelected,
    cycleSelectedMaterial,
    setSelectedScale,
    rotateSelected,
    selectBlock,
    selectNextBlock,
    reset
  } = useBlockManager({ scene });

  const gestureRef = useRef(gestureState);
  const activeBlockRef = useRef<BlockEntity | null>(null);
  const reticlePoseRef = useRef<{ position: Vector3; orientation: Quaternion } | null>(null);
  const planeHeightRef = useRef(0);
  const moveTargetRef = useRef(new Vector3());
  const orientationRef = useRef(new Quaternion());
  const directionRef = useRef(new Vector3());
  const scaleSessionRef = useRef(defaultScaleSession);
  const xrHandPoseRef = useRef<HandPose | null>(null);

  const spawnAtReticle = useCallback(() => {
    if (!reticlePoseRef.current) {
      return null;
    }
    const block = spawnBlock(reticlePoseRef.current, material);
    if (block) {
      selectBlock(block);
      activeBlockRef.current = block;
    }
    return block;
  }, [material, selectBlock, spawnBlock]);

  useEffect(() => {
    if (isSessionActive) {
      setHudVisible(false);
    } else {
      setHudVisible(true);
    }
  }, [isSessionActive]);

  useEffect(() => {
    gestureRef.current = gestureState;
  }, [gestureState]);

  useEffect(() => {
    if (reticleVisible) {
      reticlePoseRef.current = createPoseFromReticle(reticlePosition.current, reticleQuaternion.current);
      planeHeightRef.current = reticlePosition.current.y;
    }
  }, [reticleVisible]);

  useEffect(() => {
    if (!isSessionActive) {
      if (isTracking) {
        stopTracking();
      }
      xrHandPoseRef.current = null;
      setXrHandPose(null);
      return;
    }
    if (xrHandPose) {
      if (isTracking) {
        stopTracking();
      }
      return;
    }
    startTracking();
  }, [isSessionActive, isTracking, startTracking, stopTracking, xrHandPose]);

  useEffect(() => {
    if (!isSessionActive) {
      activeBlockRef.current = null;
      scaleSessionRef.current = defaultScaleSession;
    }
  }, [isSessionActive]);

  useEffect(() => {
    if (selected) {
      setMaterial(selected.materialType);
    }
  }, [selected]);

  useEffect(() => {
    if (!isSessionActive) {
      return;
    }
    const unsubscribe = addFrameListener(({ camera: frameCamera, frame, referenceSpace }) => {
      if (reticleVisible) {
        reticlePoseRef.current = createPoseFromReticle(reticlePosition.current, reticleQuaternion.current);
        planeHeightRef.current = reticlePosition.current.y;
      }
      if (frame && referenceSpace) {
        let detectedHand: HandPose | null = null;
        for (const source of frame.session.inputSources) {
          if (source.hand) {
            detectedHand = buildHandPoseFromXR(frame, referenceSpace, source.hand, source.handedness);
            if (detectedHand) {
              break;
            }
          }
        }
        if (detectedHand) {
          xrHandPoseRef.current = detectedHand;
          setXrHandPose(detectedHand);
        } else if (xrHandPoseRef.current) {
          xrHandPoseRef.current = null;
          setXrHandPose(null);
        }
      }
      const state = gestureRef.current;
      if (state.hand && state.isPinching && activeBlockRef.current) {
        const world = landmarkToWorld(
          state.hand.landmarks[8],
          frameCamera,
          planeHeightRef.current,
          activeBlockRef.current.mesh.position
        );
        if (world) {
          moveTargetRef.current.copy(world.position);
          const sourceOrientation = reticlePoseRef.current?.orientation ?? activeBlockRef.current.mesh.quaternion;
          orientationRef.current.copy(sourceOrientation);
          moveSelected({ position: moveTargetRef.current, orientation: orientationRef.current });
        }
      }
      if (state.hand && state.isPointing) {
        const direction = handDirection(state.hand, frameCamera, planeHeightRef.current);
        if (direction) {
          directionRef.current.copy(direction);
          rotateSelected(directionRef.current);
        }
      }
      if (state.isTwoFingerPinch && activeBlockRef.current) {
        const normalized = Math.max(state.twoFingerNormalized, 0.01);
        const baseline = Math.max(scaleSessionRef.current.baseNormalized, 0.01);
        const scale = scaleSessionRef.current.baseScale * (normalized / baseline);
        setSelectedScale(scale);
      }
    });
    return unsubscribe;
  }, [addFrameListener, isSessionActive, moveSelected, reticlePosition, reticleQuaternion, reticleVisible, rotateSelected, setSelectedScale]);

  useEffect(() => {
    if (!isSessionActive) {
      return;
    }
    gestureState.events.forEach((event) => {
      if (event.type === "pinch-start") {
        const current = selected ?? activeBlockRef.current;
        if (current) {
          selectBlock(current);
          activeBlockRef.current = current;
        } else if (reticlePoseRef.current) {
          spawnAtReticle();
        }
      }
      if (event.type === "pinch-end") {
        activeBlockRef.current = null;
      }
      if (event.type === "open-palm") {
        deleteSelected();
        activeBlockRef.current = null;
      }
      if (event.type === "tap") {
        const next = cycleSelectedMaterial();
        setMaterial(next ?? cycleMaterial(material));
      }
      if (event.type === "two-finger-pinch-start") {
        const target = activeBlockRef.current ?? selected;
        if (target) {
          scaleSessionRef.current = {
            baseScale: target.mesh.scale.x,
            baseNormalized: Math.max(gestureState.twoFingerNormalized, 0.01)
          };
        }
      }
      if (event.type === "two-finger-pinch-end") {
        scaleSessionRef.current = defaultScaleSession;
      }
    });
  }, [cycleSelectedMaterial, deleteSelected, gestureState.events, gestureState.twoFingerNormalized, isSessionActive, material, selected, selectBlock, spawnBlock]);

  const handleEnterAR = async () => {
    if (!isSupported) {
      return;
    }
    await enterAR();
  };

  const handleExitAR = async () => {
    await exitAR();
    reset();
    activeBlockRef.current = null;
  };

  const handleReset = () => {
    reset();
    activeBlockRef.current = null;
  };

  const handleCycleMaterial = () => {
    const next = cycleSelectedMaterial();
    const fallback = cycleMaterial(material);
    setMaterial(next ?? fallback);
  };

  const handleToggleHud = useCallback(() => {
    setHudVisible((value) => !value);
  }, []);

  const handleSimulatorSpawn = () => {
    if (!isSessionActive) {
      return;
    }
    spawnAtReticle();
  };

  const handleSimulatorSelectNext = () => {
    if (!isSessionActive) {
      return;
    }
    const next = selectNextBlock();
    activeBlockRef.current = next ?? activeBlockRef.current;
  };

  const handleSimulatorDelete = () => {
    if (!isSessionActive) {
      return;
    }
    deleteSelected();
    activeBlockRef.current = null;
  };

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (event.target && event.target instanceof HTMLElement) {
        const tagName = event.target.tagName.toLowerCase();
        if (tagName === "input" || tagName === "textarea" || event.target.isContentEditable) {
          return;
        }
      }
      const key = event.key;
      if (key === "Enter") {
        if (!isSessionActive && isSupported) {
          event.preventDefault();
          void handleEnterAR();
        }
        return;
      }
      const lower = key.toLowerCase();
      switch (lower) {
        case "e":
          if (isSessionActive) {
            event.preventDefault();
            void handleExitAR();
          }
          break;
        case "b":
          if (isSessionActive) {
            event.preventDefault();
            handleSimulatorSpawn();
          }
          break;
        case "n":
          if (isSessionActive) {
            event.preventDefault();
            handleSimulatorSelectNext();
          }
          break;
        case "d":
          if (isSessionActive) {
            event.preventDefault();
            handleSimulatorDelete();
          }
          break;
        case "m":
          if (isSessionActive) {
            event.preventDefault();
            handleCycleMaterial();
          }
          break;
        case "r":
          if (isSessionActive) {
            event.preventDefault();
            handleReset();
          }
          break;
        case "h":
          event.preventDefault();
          handleToggleHud();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("keydown", keyHandler);
    };
  }, [handleCycleMaterial, handleEnterAR, handleExitAR, handleReset, handleSimulatorDelete, handleSimulatorSelectNext, handleSimulatorSpawn, handleToggleHud, isSessionActive, isSupported]);

  return (
    <div className="app-shell">
      <ARCanvas containerRef={containerRef} videoRef={videoRef}>
        <UIControls
          supportsXR={isSupported}
          isSessionActive={isSessionActive}
          onEnterAR={handleEnterAR}
          onExitAR={handleExitAR}
          onReset={handleReset}
          trackingEnabled={isTracking}
          currentMaterial={material}
          onCycleMaterial={handleCycleMaterial}
          blockCount={blockCount}
          onSimulatorSpawn={handleSimulatorSpawn}
          onSimulatorSelectNext={handleSimulatorSelectNext}
          onSimulatorDelete={handleSimulatorDelete}
          hudVisible={hudVisible}
          onToggleHud={handleToggleHud}
        />
      </ARCanvas>
    </div>
  );
};

export default App;
