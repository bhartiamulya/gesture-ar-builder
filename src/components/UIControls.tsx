import { BlockCounter } from "./BlockCounter";

interface UIControlsProps {
  supportsXR: boolean;
  isSessionActive: boolean;
  onEnterAR: () => void;
  onExitAR: () => void;
  onReset: () => void;
  trackingEnabled: boolean;
  currentMaterial: string;
  onCycleMaterial: () => void;
  blockCount: number;
  onSimulatorSpawn: () => void;
  onSimulatorSelectNext: () => void;
  onSimulatorDelete: () => void;
  hudVisible: boolean;
  onToggleHud: () => void;
}

export const UIControls = ({
  supportsXR,
  isSessionActive,
  onEnterAR,
  onExitAR,
  onReset,
  trackingEnabled,
  currentMaterial,
  onCycleMaterial,
  blockCount,
  onSimulatorSpawn,
  onSimulatorSelectNext,
  onSimulatorDelete,
  hudVisible,
  onToggleHud
}: UIControlsProps) => {
  const overlayClassName = hudVisible ? "overlay-ui" : "overlay-ui overlay-hidden";
  return (
    <div className={overlayClassName}>
      <h1>Gesture Blocks AR</h1>
      <p>{supportsXR ? "Raise your hand to build blocks in AR." : "WebXR immersive AR is not supported on this device."}</p>
      <div className="controls-row">
        <button onClick={isSessionActive ? onExitAR : onEnterAR}>
          {isSessionActive ? "Exit AR" : "Enter AR"}
        </button>
        <button onClick={onReset} disabled={!isSessionActive}>
          Reset Scene
        </button>
        <button onClick={onCycleMaterial} disabled={!isSessionActive}>
          Material: {currentMaterial}
        </button>
      </div>
      <div className="controls-row" aria-label="Simulator controls">
        <button onClick={onSimulatorSpawn} disabled={!isSessionActive}>
          Spawn Block
        </button>
        <button onClick={onSimulatorSelectNext} disabled={!isSessionActive}>
          Select Next
        </button>
        <button onClick={onSimulatorDelete} disabled={!isSessionActive}>
          Delete Selected
        </button>
      </div>
      <div className="status-bar">
        <BlockCounter count={blockCount} />
        <span className="status-item">
          <strong>Gestures:</strong> {trackingEnabled ? "On" : "Off"}
        </span>
      </div>
      <p className="hint-line">Shortcuts: Enter=Enter AR · E=Exit · B=Spawn · N=Select next · D=Delete · M=Material · R=Reset · H=Toggle HUD</p>
      <button className="hud-toggle" onClick={onToggleHud}>
        {hudVisible ? "Hide HUD (H)" : "Show HUD (H)"}
      </button>
    </div>
  );
};
