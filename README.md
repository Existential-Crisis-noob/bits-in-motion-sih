# BITS in Motion

A presentation-ready Smart India Hackathon prototype for Problem Statement 26196: a hostel-friendly fitness companion for students with limited space, time and equipment.

The working demo proves the complete loop:

**Profile → Personalized Plan → Live Camera → Rep Count + Basic Correction → Session Result → Progress**

## Run locally

Requirements: Node.js 18 or newer and a current Chrome, Edge or Safari browser.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). Camera access works on localhost or HTTPS and is requested only after **Start Camera** is pressed.

Production verification:

```bash
npm test
npm run build
npm run preview
```

All dependency versions are pinned in `package.json` and locked in `package-lock.json`. The lightweight pose model and MediaPipe WebAssembly runtime are bundled under `public/` so the flagship flow does not need to download model files during the demo.

## Architecture

- `src/screens` — the six main product screens: welcome, profile, plan, live coach, result and progress.
- `src/components` — reusable navigation, workout, food-guidance and step components.
- `src/data` — structured exercise definitions.
- `src/utils` — BMI, MET calorie estimate, localStorage and transparent workout recommendation rules.
- `src/vision/angle.js` — three-point joint-angle calculation and best-visible-leg selection.
- `src/vision/squatStateMachine.js` — configurable, debounced Standing → Down → Standing rep counter.
- `src/vision/poseLandmarker.js` — MediaPipe initialization, GPU-to-CPU fallback and pose drawing.
- `src/vision/camera.js` — permission request and media-track cleanup.
- `public/manifest.webmanifest` and `public/sw.js` — lightweight installable PWA shell.

Profile and session history are browser-local. Raw camera frames are never saved, uploaded or recorded.

## Camera logic

The live coach tracks one pose with MediaPipe Pose Landmarker Lite. It calculates the hip-knee-ankle angle on the leg whose required landmarks have the strongest minimum visibility.

The configurable defaults in `src/vision/squatStateMachine.js` are:

- standing: 160° or above;
- down position: 110° or below;
- at least 4 stable frames and 120 ms before a state transition;
- at least 800 ms between counted repetitions;
- minimum required landmark visibility: 0.60.

Only a stable Standing → Down → Standing cycle counts. Low-visibility observations reset the state candidate and never increment the counter. Feedback messages are held by priority for a short period to avoid flicker.

This is basic observable 2D pose feedback, not medical guidance, injury prevention or a trainer-level posture assessment.

## Calorie estimate

The result uses:

`estimated kcal = 3.8 MET × weight in kg × duration in hours`

The prototype assumes **3.8 MET**, the Adult Compendium value commonly used for moderate calisthenics. It is labelled as an estimate because actual expenditure varies by pace, movement quality, body composition and individual physiology. Reference: [Compendium of Physical Activities](https://pacompendium.com/).

## Judge demo script

1. On Welcome, select **Try judge demo**.
2. Point out the preloaded 20-year-old beginner profile, BMI 22.9 and non-medical disclaimer.
3. Select **Create my plan** and explain why the 20-minute plan is beginner-paced, hostel-friendly and equipment-free.
4. On **Bodyweight squats**, select **Start camera coach**.
5. Wait for “Ready when you are,” then select **Start Camera** and grant browser permission.
6. Step back until hips, knees and ankles are visible. Perform three slow squats: stand tall, reach the down threshold, then return to standing.
7. Show the rep count, live knee angle, movement stage and held correction cues. Use **Reset** if needed.
8. Select **End session**, explain the labelled MET estimate, then **Save session**.
9. Open **Progress** to show the real saved session alongside clearly labelled sample history.

For a reliable stage demo, place the camera roughly hip height, keep the whole body inside the frame, stand mostly side-on and use even lighting.

## Known limitations

- Thresholds are intentionally conservative and may need per-user calibration for different mobility, proportions and camera angles.
- A single RGB camera provides 2D observations; occlusion, loose clothing, low light and front-on positioning can reduce landmark visibility.
- Only squats use camera analysis in this narrow prototype. Other exercises are plan cards.
- History is stored per browser with localStorage; clearing site data removes it.
- The PWA service worker caches the app shell and visited local assets; it is deliberately lightweight rather than a full offline workout engine.
- No upload-analysis mode is included because no local squat video was supplied and the live camera flow was prioritized.

## Attribution and licences

- Pose detection uses Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`, Apache-2.0) and follows the architecture in the [official Pose Landmarker Web guide](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js) and [official webcam example](https://codepen.io/mediapipe-preview/pen/abRLMxN).
- Hysteresis/state-machine concepts were reviewed against [RepCounterSDK](https://github.com/NazarKozak/RepCounterSDK) (MIT).
- Three-point joint-angle exercise concepts were reviewed against [GC_Fit](https://github.com/TheUnknown550/GC_Fit) (MIT).
- No source code, interface or branding was copied from either conceptual reference. The angle utility, visibility gating, state machine and React interface in this repository were implemented specifically for BITS in Motion.
- The BITS in Motion logo was supplied with the project reference materials and is preserved as the product identity.
