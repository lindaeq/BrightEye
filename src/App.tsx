import { useEffect, useRef, useState } from 'react';
import { Camera, Mouse, Volume2, VolumeX } from 'lucide-react';
import { useArcade } from './context/ArcadeContext';
import { ArcadeControllerProvider, useArcadeController } from './context/ArcadeController';
import { useCameraFeed } from './components/common/CameraFeed';
import { PixelSprite } from './components/common/PixelSprite';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { WarmupScreen } from './components/screens/WarmupScreen';
import { HowToScreen } from './components/screens/HowToScreen';
import { Mission1Screen } from './components/screens/Mission1Screen';
import { Mission2Screen } from './components/screens/Mission2Screen';
import { ResultsScreen } from './components/screens/ResultsScreen';
import { OperatorScreen } from './components/screens/OperatorScreen';

const stages = ['profile', 'warmup', 'howto', 'mission1', 'mission2', 'results'];
const screens = {
  profile: ProfileScreen, warmup: WarmupScreen, howto: HowToScreen,
  mission1: Mission1Screen, mission2: Mission2Screen, results: ResultsScreen,
};

export function AppContent() {
  const { stepId, nextStep, goToStep, setPlayerProfile, resetCalibration, resetMission1, resetMission2, soundMuted, toggleMute } = useArcade();
  const controller = useArcadeController();
  const { setMouseMode } = controller;
  const camera = useCameraFeed();
  const [showCamera, setShowCamera] = useState(false);
  const home = stepId === 'start';
  const operator = stepId === 'operator';
  const Screen = home || operator ? null : screens[stepId];
  const stage = stages.indexOf(stepId);
  const scene = useRef<HTMLDivElement>(null);
  const hardwareReady = camera.ready && !!controller.status.source && controller.status.joystick && controller.status.button;
  const canStart = controller.mouseMode || hardwareReady;
  const inlinePreview = home || (stepId === 'warmup' && (!controller.mouseMode || camera.ready));
  const showPreview = inlinePreview || showCamera;

  useEffect(() => {
    scene.current?.focus();
  }, [stepId]);

  function startGame() {
    if (!canStart) return;
    setPlayerProfile((profile) => ({ ...profile, consentAdult: false }));
    resetCalibration();
    resetMission1();
    resetMission2();
    nextStep();
  }

  return (
    <div className="arcade-shell">
      <header className="arcade-hud">
        <span className="arcade-brand"><PixelSprite name="inv" size={2} /> AeroNeuro</span>
        {stage >= 0 && (
          <div className="flight-progress" role="progressbar" aria-label="Flight progress"
            aria-valuemin={0} aria-valuemax={stages.length} aria-valuenow={stage + 1}>
            {stages.map((item, index) => <span key={item} data-reached={index <= stage} />)}
          </div>
        )}
        <div className="arcade-hud-actions">
          {!inlinePreview && (
            <button type="button" className="arcade-icon" onClick={() => setShowCamera((visible) => !visible)}
              aria-label="Camera preview" aria-pressed={showCamera}><Camera size={18} /></button>
          )}
          <button type="button" className="arcade-icon" aria-label="Mouse and touchpad mode"
            title="Mouse and touchpad mode" aria-pressed={controller.mouseMode}
            onClick={() => setMouseMode(!controller.mouseMode)}><Mouse size={18} /></button>
          <button type="button" className="arcade-icon" onClick={toggleMute}
            aria-label={soundMuted ? 'Unmute sound' : 'Mute sound'}>
            {soundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </header>
      <main className="arcade-display" data-home={home} data-camera-inline={inlinePreview}>
        <div key={stepId} ref={scene} tabIndex={-1} className="arcade-scene">
          {Screen && <Screen />}
          {operator && <OperatorScreen cameraReady={camera.ready} />}
          {home && (
            <section className="launch-screen">
              <div className="launch-copy">
                <p className="arcade-kicker">SPACE ARCADE</p>
                <h1>Ready, pilot?</h1>
                <p aria-live="polite">{controller.mouseMode
                  ? 'Mouse mode is on. You can play without connecting hardware.'
                  : 'Check your gear, or select the mouse icon above to play without hardware.'}</p>
                <ul className="preflight-checks" aria-label="Launch checklist" aria-live="polite">
                  <li data-ready={camera.ready}>Camera <b>{camera.isQnx ? 'QNX Vision (Pi 5)' : camera.ready ? 'Ready' : camera.pending ? 'Waiting for permission' : camera.error ? 'Unavailable' : 'Enable camera'}</b></li>
                  <li data-ready={!!controller.status.source}>{controller.status.source === 'gamepad' ? 'USB gamepad' : 'Arduino'} <b>{controller.status.source ? 'Connected' : 'Waiting for input'}</b></li>
                  <li data-ready={controller.status.joystick}>Joystick <b>{controller.status.joystick ? 'Ready' : 'Move the stick'}</b></li>
                  <li data-ready={controller.status.button}>Action button <b>{controller.status.button ? 'Ready' : 'Press the button'}</b></li>
                </ul>
                <div className="setup-actions">
                  {controller.canConnectSerial && (
                    <button type="button" className="arcade-btn arduino-btn" disabled={controller.connecting}
                      onClick={controller.serialOpen ? controller.disconnect : controller.connect}>
                      {controller.connecting ? 'Connecting…' : controller.serialOpen ? 'Disconnect Arduino' : 'Connect Arduino'}
                    </button>
                  )}
                  <button type="button" className="arcade-btn" disabled={!canStart}
                    onClick={startGame}>Start game</button>
                  <button type="button" className="arcade-text-button" onClick={() => goToStep('operator')}>Operator view</button>
                </div>
                {controller.message && controller.status.source !== 'serial' && (
                  <p className={controller.message.error ? 'input-hint setup-error' : 'input-hint'}
                    role={controller.message.error ? 'alert' : 'status'}>{controller.message.text}</p>
                )}
                {!controller.status.source && (
                  <p className="input-hint">
                    {controller.canConnectSerial ? 'Choose the Arduino serial port or connect a USB gamepad.' : 'Use Chrome or Edge for Arduino serial, or connect a USB gamepad.'}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
        <aside className="camera-monitor" hidden={!showPreview} aria-label="Camera preview">
          <div className="camera-preview" data-ready={camera.ready}>
            {camera.isQnx ? (
              <img
                src={camera.streamUrl}
                alt="QNX RTOS Iris Tracking Feed"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <video ref={camera.video} autoPlay muted playsInline aria-label="Live webcam feed" />
            )}
            {!camera.ready && <Camera className="camera-placeholder" size={28} aria-hidden="true" />}
            {camera.ready && (
              <span className="camera-live">
                {camera.isQnx ? 'QNX RTOS LIVE' : 'Camera live'}
              </span>
            )}
          </div>
          {!camera.ready && !camera.isQnx && (
            <div className="camera-actions">
              <button type="button" className="arcade-btn alt" disabled={camera.pending} onClick={camera.enable}>
                {camera.pending ? 'Waiting for camera…' : 'Enable camera'}
              </button>
              {camera.error && <p className="input-hint setup-error" role="alert">{camera.error}</p>}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

export function App() {
  return <ArcadeControllerProvider><AppContent /></ArcadeControllerProvider>;
}

export default App;
