import { PropsWithChildren } from "react";

interface ARCanvasProps {
  containerRef: React.RefObject<HTMLDivElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const ARCanvas = ({ containerRef, videoRef, children }: PropsWithChildren<ARCanvasProps>) => {
  return (
    <div className="canvas-wrapper">
      <div className="xr-stage" ref={containerRef}>
        <div className="overlay-root">{children}</div>
      </div>
      <video ref={videoRef} playsInline muted style={{ display: "none" }} />
    </div>
  );
};
