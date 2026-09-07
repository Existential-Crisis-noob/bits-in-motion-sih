import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, CircleStop, Info, LoaderCircle, RefreshCw, RotateCcw, ShieldCheck, TriangleAlert, VideoOff } from 'lucide-react';
import StepRail from '../components/StepRail';
import { getCameraErrorState, isCameraSupported, startCamera, stopCamera } from '../vision/camera';
import { getBestKneeMeasurement } from '../vision/angle';
import { clearPoseOverlay, drawPoseOverlay, initializePoseLandmarker } from '../vision/poseLandmarker';
import { createSquatCounter, SQUAT_CONFIG } from '../vision/squatStateMachine';

const INITIAL_FEEDBACK = { message: 'Stand tall and keep your full body in frame', tone: 'neutral', priority: 0, until: 0 };

function stageLabel(stage) {
  return {
    'finding-standing': 'Finding start',
    standing: 'Standing',
    lowering: 'Lowering',
    down: 'Down position',
    rising: 'Standing up',
  }[stage] || 'Tracking';
}

export default function CoachScreen({ onBack, onEndSession }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const counterRef = useRef(createSquatCounter());
  const feedbackRef = useRef(INITIAL_FEEDBACK);
  const sessionStartedAtRef = useRef(null);
  const framingInterruptionsRef = useRef(0);
  const missingPoseRef = useRef(false);
  const mountedRef = useRef(true);

  const [modelStatus, setModelStatus] = useState('loading');
  const [modelNote, setModelNote] = useState('Loading the lightweight pose model…');
  const [cameraStatus, setCameraStatus] = useState('idle');
  const [cameraError, setCameraError] = useState('');
  const [reps, setReps] = useState(0);
  const [stage, setStage] = useState('finding-standing');
  const [angle, setAngle] = useState(null);
  const [feedback, setFeedback] = useState(INITIAL_FEEDBACK);
  const [videoAspect, setVideoAspect] = useState(4 / 3);

  const publishFeedback = useCallback((message, tone, holdMs = 700, priority = 1) => {
    const now = performance.now();
    const current = feedbackRef.current;
    if (now < current.until && priority < current.priority) return;
    if (message === current.message && now < current.until) return;
    const next = { message, tone, priority, until: now + holdMs };
    feedbackRef.current = next;
    if (mountedRef.current) setFeedback(next);
  }, []);

  const loadModel = useCallback(async () => {
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    setModelStatus('loading');
    setModelNote('Loading the lightweight pose model…');
    try {
      const landmarker = await initializePoseLandmarker(() => {
        if (mountedRef.current) setModelNote('GPU unavailable—switching to compatible CPU mode…');
      });
      if (!mountedRef.current) {
        landmarker.close();
        return;
      }
      landmarkerRef.current = landmarker;
      setModelStatus('ready');
      setModelNote('Pose model ready');
    } catch (error) {
      console.error('Pose model initialization failed.', error);
      if (mountedRef.current) {
        setModelStatus('error');
        setModelNote('The pose model could not load. Check the connection and try again.');
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadModel();
    return () => {
      mountedRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      stopCamera(streamRef.current, videoRef.current);
      streamRef.current = null;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, [loadModel]);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker || !streamRef.current) return;

    if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (video.videoWidth && video.videoHeight) setVideoAspect(video.videoWidth / video.videoHeight);
      }

      try {
        const result = landmarker.detectForVideo(video, performance.now());
        const landmarks = result.landmarks?.[0];
        drawPoseOverlay(canvas, landmarks);
        const measurement = getBestKneeMeasurement(landmarks, SQUAT_CONFIG.minVisibility);
        const state = counterRef.current.update({
          angle: measurement.angle,
          visibility: measurement.visibility,
          timestamp: performance.now(),
        });

        setReps(state.reps);
        setStage(state.phase);
        setAngle(measurement.valid ? measurement.angle : null);

        if (!measurement.valid) {
          if (!missingPoseRef.current) framingInterruptionsRef.current += 1;
          missingPoseRef.current = true;
          publishFeedback('Move back — keep your full body visible', 'warning', 900, 4);
        } else {
          missingPoseRef.current = false;
          if (state.event === 'rep') {
            publishFeedback('Great rep', 'success', 1200, 6);
          } else if (state.event === 'depth' || state.phase === 'down') {
            publishFeedback('Good depth — stand back up', 'success', 850, 5);
          } else if (state.phase === 'lowering' && measurement.angle <= SQUAT_CONFIG.shallowCueAngle) {
            publishFeedback('Go slightly lower', 'warning', 750, 3);
          } else if (state.phase === 'standing') {
            publishFeedback('Ready — lower with control', 'neutral', 650, 1);
          } else if (state.phase === 'finding-standing') {
            publishFeedback('Stand tall to begin', 'neutral', 650, 2);
          }
        }
      } catch (error) {
        console.error('Pose detection frame failed.', error);
        publishFeedback('Tracking paused — hold still for a moment', 'warning', 900, 4);
      }
    }

    animationRef.current = requestAnimationFrame(processFrame);
  }, [publishFeedback]);

  async function handleStartCamera() {
    if (!isCameraSupported()) {
      setCameraStatus('unsupported');
      setCameraError('This browser does not provide camera access. Try a current version of Chrome, Edge or Safari.');
      return;
    }
    setCameraStatus('starting');
    setCameraError('');
    try {
      const stream = await startCamera(videoRef.current);
      if (!mountedRef.current) {
        stopCamera(stream, videoRef.current);
        return;
      }
      streamRef.current = stream;
      sessionStartedAtRef.current = Date.now();
      lastVideoTimeRef.current = -1;
      setCameraStatus('running');
      animationRef.current = requestAnimationFrame(processFrame);
    } catch (error) {
      const state = getCameraErrorState(error);
      setCameraStatus(state.status);
      setCameraError(state.message);
    }
  }

  function stopSessionCamera() {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    stopCamera(streamRef.current, videoRef.current);
    streamRef.current = null;
    clearPoseOverlay(canvasRef.current);
  }

  function handleReset() {
    counterRef.current.reset();
    setReps(0);
    setStage('finding-standing');
    setAngle(null);
    sessionStartedAtRef.current = Date.now();
    framingInterruptionsRef.current = 0;
    missingPoseRef.current = false;
    const next = { ...INITIAL_FEEDBACK, until: performance.now() + 700 };
    feedbackRef.current = next;
    setFeedback(next);
  }

  function handleEnd() {
    const durationSeconds = sessionStartedAtRef.current
      ? Math.max(1, Math.round((Date.now() - sessionStartedAtRef.current) / 1000))
      : 0;
    stopSessionCamera();
    const formSummary = reps === 0
      ? 'No complete Standing → Down → Standing cycle was captured yet.'
      : framingInterruptionsRef.current === 0
        ? 'Every counted repetition reached the configured depth with clear leg landmarks.'
        : `Completed ${reps} depth-qualified ${reps === 1 ? 'rep' : 'reps'} with ${framingInterruptionsRef.current} framing ${framingInterruptionsRef.current === 1 ? 'reminder' : 'reminders'}.`;
    onEndSession({ reps, durationSeconds, formSummary, framingInterruptions: framingInterruptionsRef.current });
  }

  function handleBack() {
    stopSessionCamera();
    onBack();
  }

  const canStart = modelStatus === 'ready' && ['idle', 'denied', 'unsupported', 'error'].includes(cameraStatus);
  const isRunning = cameraStatus === 'running';

  return (
    <main className="coach-page">
      <div className="coach-topbar">
        <button className="icon-button icon-button-dark" onClick={handleBack} aria-label="Back to plan"><ArrowLeft size={21} /></button>
        <div><span className="eyebrow light">Live squat coach</span><small>Basic observable pose feedback</small></div>
        <button className="coach-reset" onClick={handleReset} disabled={!isRunning}><RotateCcw size={17} /> Reset</button>
      </div>
      <StepRail current="Coach" />

      <div className="coach-layout">
        <section className="camera-panel">
          <div className="camera-viewport" style={{ aspectRatio: videoAspect }}>
            <video ref={videoRef} playsInline muted aria-label="Live camera preview" />
            <canvas ref={canvasRef} aria-label="Pose landmark overlay" />

            {!isRunning && (
              <div className="camera-empty">
                {modelStatus === 'loading' && <><LoaderCircle className="spin" size={38} /><h2>Preparing your coach</h2><p>{modelNote}</p></>}
                {modelStatus === 'error' && <><TriangleAlert size={38} /><h2>Model unavailable</h2><p>{modelNote}</p><button className="button button-white" onClick={loadModel}><RefreshCw size={18} /> Retry model</button></>}
                {modelStatus === 'ready' && ['idle', 'starting'].includes(cameraStatus) && <><Camera size={40} /><h2>{cameraStatus === 'starting' ? 'Starting camera…' : 'Ready when you are'}</h2><p>Place your device so your hips, knees and ankles will stay visible.</p><button className="button button-primary button-large" onClick={handleStartCamera} disabled={!canStart}>{cameraStatus === 'starting' ? <LoaderCircle className="spin" size={18} /> : <Camera size={18} />} Start Camera</button></>}
                {modelStatus === 'ready' && ['denied', 'unsupported', 'error'].includes(cameraStatus) && <><VideoOff size={40} /><h2>{cameraStatus === 'denied' ? 'Camera permission needed' : cameraStatus === 'unsupported' ? 'Camera not supported' : 'Camera could not start'}</h2><p>{cameraError}</p>{cameraStatus !== 'unsupported' && <button className="button button-white" onClick={handleStartCamera}><RefreshCw size={18} /> Try again</button>}</>}
              </div>
            )}

            {isRunning && <div className="live-badge"><span /> Live · processed locally</div>}
          </div>

          <div className={`coach-feedback ${feedback.tone}`} aria-live="polite">
            <span>{feedback.tone === 'success' ? 'On track' : feedback.tone === 'warning' ? 'Adjust' : 'Coach cue'}</span>
            <strong>{feedback.message}</strong>
          </div>
        </section>

        <aside className="coach-metrics">
          <div className="rep-card"><span>Complete reps</span><strong>{reps}</strong><small>Standing → Down → Standing</small></div>
          <div className="metric-row"><div><span>Movement stage</span><strong>{stageLabel(stage)}</strong></div><div><span>Knee angle</span><strong>{angle === null ? '—' : `${Math.round(angle)}°`}</strong></div></div>
          <div className="coach-guide panel-dark">
            <span className="eyebrow light">Three simple cues</span>
            <ol><li><i>1</i>Stand tall to set the start position.</li><li><i>2</i>Lower until the knee angle reaches the depth threshold.</li><li><i>3</i>Stand tall again to count one rep.</li></ol>
          </div>
          <div className="local-processing"><ShieldCheck size={20} /><p><strong>No camera recording.</strong> Frames are processed in the browser and discarded immediately.</p></div>
          <div className="coach-disclaimer"><Info size={16} /> This prototype gives basic visible pose cues, not medical or trainer-level assessment.</div>
          <button className="button button-danger" onClick={handleEnd} disabled={!isRunning}><CircleStop size={18} /> End session</button>
        </aside>
      </div>
    </main>
  );
}
