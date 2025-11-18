import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Mesh,
  RingGeometry,
  MeshBasicMaterial,
  Group,
  AmbientLight,
  DirectionalLight,
  Material
} from "three";

export interface XRSceneResources {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  reticle: Mesh;
}

export const initXRScene = (container: HTMLElement): XRSceneResources => {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.xr.enabled = true;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.01, 20);

  const lightingRig = new Group();
  const ambient = new AmbientLight(0xffffff, 0.5);
  const directional = new DirectionalLight(0xffffff, 0.8);
  directional.position.set(0.5, 1, 0.5);
  lightingRig.add(ambient);
  lightingRig.add(directional);
  scene.add(lightingRig);

  const reticleGeometry = new RingGeometry(0.08, 0.1, 32);
  const reticleMaterial = new MeshBasicMaterial({ color: 0xffffff, opacity: 0.7, transparent: true });
  const reticle = new Mesh(reticleGeometry, reticleMaterial);
  reticle.rotateX(-Math.PI / 2);
  reticle.visible = false;
  scene.add(reticle);

  return { renderer, scene, camera, reticle };
};

export const disposeXRScene = (resources: XRSceneResources) => {
  resources.renderer.setAnimationLoop(null);
  void resources.renderer.xr.setSession(null);
  resources.scene.remove(resources.reticle);
  if (Array.isArray(resources.reticle.material)) {
    resources.reticle.material.forEach((material: Material) => material.dispose());
  } else {
    (resources.reticle.material as Material).dispose();
  }
  resources.reticle.geometry.dispose();
  resources.scene.clear();
  resources.renderer.dispose();
  if (resources.renderer.domElement.parentElement) {
    resources.renderer.domElement.parentElement.removeChild(resources.renderer.domElement);
  }
};
