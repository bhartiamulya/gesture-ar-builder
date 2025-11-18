import { useCallback, useRef, useState } from "react";
import { Scene, Vector3, Quaternion, Object3D, MathUtils } from "three";
import {
  BlockEntity,
  BlockMaterialType,
  addBlockToScene,
  createBlock,
  cycleMaterial,
  removeBlockFromScene,
  updateBlockMaterial
} from "../three/block";

interface BlockState {
  blocks: BlockEntity[];
  selectedId: string | null;
}

interface BlockManagerOptions {
  scene: Scene | null;
}

interface BlockPose {
  position: Vector3;
  orientation: Quaternion;
}

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export const useBlockManager = ({ scene }: BlockManagerOptions) => {
  const stateRef = useRef<BlockState>({ blocks: [], selectedId: null });
  const [version, setVersion] = useState(0);

  const commit = useCallback(() => {
    setVersion((value) => value + 1);
  }, []);

  const getSelected = useCallback(() => {
    if (!stateRef.current.selectedId) {
      return null;
    }
    return stateRef.current.blocks.find((block) => block.id === stateRef.current.selectedId) ?? null;
  }, []);

  const selectBlock = useCallback((block: BlockEntity | null) => {
    stateRef.current.selectedId = block?.id ?? null;
    commit();
  }, [commit]);

  const selectNextBlock = useCallback(() => {
    const blocks = stateRef.current.blocks;
    if (blocks.length === 0) {
      return null;
    }
    const currentIndex = stateRef.current.selectedId
      ? blocks.findIndex((block) => block.id === stateRef.current.selectedId)
      : -1;
    const nextIndex = (currentIndex + 1) % blocks.length;
    const nextBlock = blocks[nextIndex];
    stateRef.current.selectedId = nextBlock.id;
    commit();
    return nextBlock;
  }, [commit]);

  const spawnBlock = useCallback(
    (pose: BlockPose, material: BlockMaterialType = "metal") => {
      if (!scene) {
        return null;
      }
      const id = generateId();
      const block = createBlock(id, material);
      addBlockToScene(scene, block, pose.position, pose.orientation);
      stateRef.current.blocks.push(block);
      stateRef.current.selectedId = id;
      commit();
      return block;
    },
    [commit, scene]
  );

  const moveBlock = useCallback((block: BlockEntity, pose: BlockPose) => {
    block.mesh.position.lerp(pose.position, 0.3);
    block.mesh.quaternion.slerp(pose.orientation, 0.3);
  }, []);

  const scaleBlock = useCallback((block: BlockEntity, scaleFactor: number) => {
    const clamped = MathUtils.clamp(scaleFactor, 0.3, 3);
    block.mesh.scale.setScalar(clamped);
  }, []);

  const rotateBlockToDirection = useCallback((block: BlockEntity, direction: Vector3) => {
    const target = new Object3D();
    target.position.copy(block.mesh.position);
    target.lookAt(block.mesh.position.clone().add(direction));
    block.mesh.quaternion.slerp(target.quaternion, 0.25);
  }, []);

  const deleteSelected = useCallback(() => {
    if (!scene) {
      return;
    }
    const selected = getSelected();
    if (!selected) {
      return;
    }
    removeBlockFromScene(scene, selected);
    stateRef.current.blocks = stateRef.current.blocks.filter((block) => block.id !== selected.id);
    stateRef.current.selectedId = null;
    commit();
  }, [commit, getSelected, scene]);

  const reset = useCallback(() => {
    if (scene) {
      stateRef.current.blocks.forEach((block) => {
        removeBlockFromScene(scene, block);
      });
    }
    stateRef.current.blocks = [];
    stateRef.current.selectedId = null;
    commit();
  }, [commit, scene]);

  const cycleSelectedMaterial = useCallback(() => {
    const selected = getSelected();
    if (!selected) {
      return null;
    }
    const next = cycleMaterial(selected.materialType);
    updateBlockMaterial(selected, next);
    commit();
    return next;
  }, [commit, getSelected]);

  const setSelectedScale = useCallback((scale: number) => {
    const selected = getSelected();
    if (!selected) {
      return;
    }
    scaleBlock(selected, scale);
  }, [getSelected, scaleBlock]);

  const moveSelected = useCallback(
    (pose: BlockPose) => {
      const selected = getSelected();
      if (!selected) {
        return;
      }
      moveBlock(selected, pose);
    },
    [getSelected, moveBlock]
  );

  const rotateSelected = useCallback(
    (direction: Vector3) => {
      const selected = getSelected();
      if (!selected) {
        return;
      }
      rotateBlockToDirection(selected, direction);
    },
    [getSelected, rotateBlockToDirection]
  );

  return {
    version,
    blocks: stateRef.current.blocks.slice(),
    selected: getSelected(),
    blockCount: stateRef.current.blocks.length,
    spawnBlock,
    moveSelected,
    deleteSelected,
    cycleSelectedMaterial,
    setSelectedScale,
    rotateSelected,
    selectBlock,
    selectNextBlock,
    reset
  };
};
