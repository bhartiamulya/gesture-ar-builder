import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { initXRScene, disposeXRScene, XRSceneResources } from "../three/xrScene";
import { Scene, PerspectiveCamera, WebGLRenderer, Mesh, Vector3, Quaternion } from "three";

export interface XRFramePayload {
  timestamp: number;
  frame: XRFrame;
  referenceSpace: XRReferenceSpace;
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  reticle: Mesh;
}

export const useXR = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resourcesRef = useRef<XRSceneResources | null>(null);
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
  const referenceSpaceRef = useRef<XRReferenceSpace | null>(null);
  const frameCallbacksRef = useRef(new Set<(payload: XRFramePayload) => void>());
  const sessionEndHandlerRef = useRef<((event: XRSessionEvent) => void) | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [reticleMatrixVersion, setReticleMatrixVersion] = useState(0);
  const [reticleVisible, setReticleVisible] = useState(false);
  const reticlePosition = useRef(new Vector3());
  const reticleQuaternion = useRef(new Quaternion());

  useEffect(() => {
    let cancelled = false;
    if (navigator.xr?.isSessionSupported) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported: boolean) => {
        if (!cancelled) {
          setIsSupported(supported);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const cleanupSession = useCallback(async () => {
    const session = resourcesRef.current?.renderer.xr.getSession();
    if (session) {
      frameCallbacksRef.current.clear();
      hitTestSourceRef.current?.cancel();
      hitTestSourceRef.current = null;
      referenceSpaceRef.current = null;
      if (sessionEndHandlerRef.current) {
        session.removeEventListener("end", sessionEndHandlerRef.current);
        sessionEndHandlerRef.current = null;
      }
      await session.end();
    }
    if (resourcesRef.current) {
      disposeXRScene(resourcesRef.current);
      resourcesRef.current = null;
    }
    setReticleVisible(false);
    setIsSessionActive(false);
  }, []);

  const handleResize = useCallback(() => {
    if (!resourcesRef.current || !containerRef.current) {
      return;
    }
    const { renderer, camera } = resourcesRef.current;
    const { clientWidth, clientHeight } = containerRef.current;
    renderer.setSize(clientWidth, clientHeight);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }, []);

  const setupHitTest = useCallback(async (session: XRSession) => {
    const referenceSpace = await session.requestReferenceSpace("local");
    const viewerSpace = await session.requestReferenceSpace("viewer");
    if (session.requestHitTestSource) {
      const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
      hitTestSourceRef.current = hitTestSource ?? null;
    } else {
      hitTestSourceRef.current = null;
    }
    referenceSpaceRef.current = referenceSpace;
  }, []);

  const startRenderLoop = useCallback((session: XRSession) => {
    if (!resourcesRef.current) {
      return;
    }
    const { renderer, scene, camera, reticle } = resourcesRef.current;
    renderer.xr.setReferenceSpaceType("local");
    renderer.xr.setSession(session);
    const onSessionEnd = () => {
      window.removeEventListener("resize", handleResize);
      cleanupSession();
    };
    sessionEndHandlerRef.current = onSessionEnd;
    session.addEventListener("end", onSessionEnd);
    renderer.setAnimationLoop((timestamp: number, frame?: XRFrame) => {
      if (!frame || !referenceSpaceRef.current) {
        renderer.render(scene, camera);
        return;
      }
      const hitTestSource = hitTestSourceRef.current;
      if (hitTestSource) {
        const results = frame.getHitTestResults(hitTestSource);
        if (results.length > 0) {
          const pose = results[0].getPose(referenceSpaceRef.current);
          if (pose) {
            const { x, y, z } = pose.transform.position;
            reticle.position.set(x, y, z);
            reticle.quaternion.set(
              pose.transform.orientation.x,
              pose.transform.orientation.y,
              pose.transform.orientation.z,
              pose.transform.orientation.w
            );
            reticle.visible = true;
            if (!reticleVisible) {
              setReticleVisible(true);
            }
            reticlePosition.current.copy(reticle.position);
            reticleQuaternion.current.copy(reticle.quaternion);
            setReticleMatrixVersion((value) => value + 1);
          }
        } else {
          reticle.visible = false;
          if (reticleVisible) {
            setReticleVisible(false);
          }
        }
      }
      renderer.render(scene, camera);
      frameCallbacksRef.current.forEach((callback) => {
        callback({
          timestamp,
          frame,
          referenceSpace: referenceSpaceRef.current as XRReferenceSpace,
          renderer,
          scene,
          camera,
          reticle
        });
      });
    });
  }, [cleanupSession, handleResize]);

  const enterAR = useCallback(async () => {
    if (!isSupported || isSessionActive || !containerRef.current) {
      return;
    }
    const resources = initXRScene(containerRef.current);
    resourcesRef.current = resources;
    window.addEventListener("resize", handleResize);
    handleResize();
    const session = await navigator.xr?.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay", "hand-tracking"],
      domOverlay: { root: containerRef.current }
    });
    if (!session) {
      return;
    }
    await setupHitTest(session);
    startRenderLoop(session);
    setIsSessionActive(true);
  }, [handleResize, isSessionActive, isSupported, setupHitTest, startRenderLoop]);

  const exitAR = useCallback(() => {
    cleanupSession();
  }, [cleanupSession]);

  const addFrameListener = useCallback((listener: (payload: XRFramePayload) => void) => {
    frameCallbacksRef.current.add(listener);
    return () => {
      frameCallbacksRef.current.delete(listener);
    };
  }, []);

  const scene = useMemo(() => resourcesRef.current?.scene ?? null, [isSessionActive, reticleMatrixVersion]);
  const camera = useMemo(() => resourcesRef.current?.camera ?? null, [isSessionActive, reticleMatrixVersion]);
  const renderer = useMemo(() => resourcesRef.current?.renderer ?? null, [isSessionActive, reticleMatrixVersion]);
  const reticle = useMemo(() => resourcesRef.current?.reticle ?? null, [isSessionActive, reticleMatrixVersion]);

  return {
    containerRef,
    isSupported,
    isSessionActive,
    enterAR,
    exitAR,
    addFrameListener,
    scene,
    camera,
    renderer,
    reticle,
    reticleVisible,
    reticlePosition,
    reticleQuaternion
  };
};
