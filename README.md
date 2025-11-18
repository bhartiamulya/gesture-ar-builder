# Gesture Blocks AR

Gesture Blocks AR is a WebXR sandbox that lets you spawn and manipulate 3D blocks using hand gestures. The project targets modern browsers with WebXR support on AR-capable hardware, and it includes simulator-first controls so you can exercise the full interaction loop inside Chrome's Immersive Web Emulator.

## Features

- WebXR immersive-AR session with hit-test reticle and block placement.
- MediaPipe Hands integration for live webcam gesture tracking (pinch, open palm, point, two-finger pinch, tap).
- Simulator controls and keyboard shortcuts for spawning, selecting, deleting, and re-materializing blocks without real gestures.
- Three.js scene with reticle visualization and reusable block factory/material system.
- Local bundling of MediaPipe assets to avoid network fetch failures.

## Requirements

- Node.js 18+
- npm (bundled with Node)
- Chrome or Chromium with WebXR support
- (Optional) Chrome Immersive Web Emulator extension for desktop testing
- AR-capable hardware (Android + ARCore, Quest browser, etc.) to see true camera passthrough. The emulator only renders a synthetic room.

## Getting Started

```bash
npm install
npm run dev
```

The Vite dev server defaults to [http://localhost:5173](http://localhost:5173).

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

## Development Scripts

- `npm run dev` – Start Vite dev server.
- `npm run build` – Produce a production bundle.
- `npm run preview` – Preview the production build locally.

## Limitations & Known Issues

- The emulator renders a synthetic gray room; it cannot replicate camera passthrough. Use real hardware to evaluate visual fidelity.
- Hand tracking quality depends on lighting and camera resolution. MediaPipe occasionally drops frames on low-end hardware.
- There are no automated tests yet. Manual testing is required after changes that touch gesture logic or block management.

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

## Contributing

1. Fork and clone the repository.
2. Run the dev server and verify the emulator flow before opening a PR.
3. Document any new keyboard shortcuts or simulator affordances in this README.

## License

MIT (see `LICENSE` if present). If no license file accompanies this repo, treat it as "all rights reserved" until one is added.
