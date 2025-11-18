import {
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  Scene,
  Vector3,
  Quaternion,
  Material
} from "three";

export type BlockMaterialType = "metal" | "wood" | "glass" | "plastic";

interface BlockMaterialConfig {
  color: number;
  metalness: number;
  roughness: number;
  transparent?: boolean;
  opacity?: number;
  transmission?: number;
}

const materialConfigs: Record<BlockMaterialType, BlockMaterialConfig> = {
  metal: { color: 0xd1d5db, metalness: 0.9, roughness: 0.2 },
  wood: { color: 0x8b5a2b, metalness: 0.05, roughness: 0.7 },
  glass: { color: 0xaad4f5, metalness: 0.05, roughness: 0, transparent: true, opacity: 0.35, transmission: 0.8 },
  plastic: { color: 0xff6b6b, metalness: 0.1, roughness: 0.5 }
};

const materialSequence: BlockMaterialType[] = ["metal", "wood", "glass", "plastic"];

const sharedGeometry = new BoxGeometry(0.18, 0.18, 0.18);

export interface BlockEntity {
  id: string;
  mesh: Mesh;
  materialType: BlockMaterialType;
}

const createMaterial = (type: BlockMaterialType) => {
  const config = materialConfigs[type];
  if (type === "glass") {
    return new MeshPhysicalMaterial({
      color: config.color,
      metalness: config.metalness,
      roughness: config.roughness,
      transparent: config.transparent,
      opacity: config.opacity,
      transmission: config.transmission
    });
  }
  return new MeshStandardMaterial({
    color: config.color,
    metalness: config.metalness,
    roughness: config.roughness,
    transparent: config.transparent,
    opacity: config.opacity
  });
};

export const createBlock = (id: string, materialType: BlockMaterialType) => {
  const mesh = new Mesh(sharedGeometry, createMaterial(materialType));
  mesh.matrixAutoUpdate = true;
  return { id, mesh, materialType } as BlockEntity;
};

export const addBlockToScene = (scene: Scene, block: BlockEntity, position: Vector3, orientation: Quaternion) => {
  block.mesh.position.copy(position);
  block.mesh.quaternion.copy(orientation);
  scene.add(block.mesh);
};

export const removeBlockFromScene = (scene: Scene, block: BlockEntity) => {
  scene.remove(block.mesh);
  if (Array.isArray(block.mesh.material)) {
    block.mesh.material.forEach((mat: Material) => mat.dispose());
  } else {
    (block.mesh.material as Material).dispose();
  }
};

export const updateBlockMaterial = (block: BlockEntity, type: BlockMaterialType) => {
  const material = createMaterial(type);
  const oldMaterial = block.mesh.material;
  block.mesh.material = material;
  if (Array.isArray(oldMaterial)) {
    oldMaterial.forEach((mat) => mat.dispose());
  } else {
    oldMaterial.dispose();
  }
  block.materialType = type;
};

export const cycleMaterial = (current: BlockMaterialType) => {
  const index = materialSequence.indexOf(current);
  const nextIndex = (index + 1) % materialSequence.length;
  return materialSequence[nextIndex];
};
