# Gesture Blocks AR

Gesture Blocks AR is a WebXR sandbox that lets you spawn and manipulate 3D blocks using hand gestures. The project targets modern browsers with WebXR support on AR-capable hardware, and it includes simulator-first controls so you can exercise the full interaction loop inside Chrome's Immersive Web Emulator.

## Features

- WebXR immersive-AR session with hit-test reticle and block placement.
- MediaPipe Hands integration for live webcam gesture tracking (pinch, open palm, point, two-finger pinch, tap).
- Simulator controls and keyboard shortcuts for spawning, selecting, deleting, and re-materializing blocks without real gestures.
- Three.js scene with reticle visualization and reusable block factory/material system.
- Local bundling of MediaPipe assets to avoid network fetch failures.

## Using the App

### Desktop (Immersive Web Emulator)

1. Install and open the Immersive Web Emulator in Chrome DevTools.
2. Click **Enter AR** (or press `Enter`) to start a polyfilled session.
3. Move or rotate the virtual device in the **room** tab until the yellow reticle hits the floor.
4. Use keyboard shortcuts to interact:
   - `B` – Spawn block at the reticle
   - `N` – Select next block
   - `D` – Delete selected block
   - `M` – Cycle material
   - `R` – Reset scene
   - `E` – Exit AR
   - `H` – Toggle the HUD overlay
5. If you prefer the on-screen HUD, press `H` to bring it back temporarily.

Physical webcam gestures are still supported. Switch the emulator to tracked-hand mode or exit the emulator to let MediaPipe read your camera directly.

### Real AR Hardware

1. Serve the app over HTTPS (or use `npm run dev -- --host` with a trusted certificate).
2. Open the URL on an AR-capable device (Chrome Android with ARCore runtime, Quest browser, etc.).
3. Grant camera permission and follow the on-screen reticle cues. Gestures operate exactly as in the simulator.

## Project Structure

```
src/
  components/   React UI components and overlay controls
  hooks/        WebXR session, hand tracking, gesture engine, block manager
  three/        Three.js scene setup and block materials
  types/        TypeScript definitions (gestures, XR).
  utils/        Hand/space helpers and XR hand translation
public/
  mediapipe/    MediaPipe assets served locally
```


