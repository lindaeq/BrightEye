import { useEffect, useRef, useState } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { eyeTrackerEnabled, liveGaze, sendEyeCalibration, useEyeTracking } from '../../utils/useEyeTracking';
import { useGazeDemo } from '../../utils/gazeDemo';
import { playSound } from '../../utils/audio';

const targets = [
  { name: 'top right', x: 84, y: 18 },
  { name: 'top left', x: 16, y: 18 },
  { name: 'bottom right', x: 84, y: 82 },
  { name: 'bottom left', x: 16, y: 82 },
  { name: 'center', x: 50, y: 50 },
];

type RawPoint = { rawX: number; rawY: number };
type Sample = RawPoint & { time: number };

function median(values: number[]) {
  const sorted = values.sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return (sorted[middle] + sorted[(sorted.length - 1) >> 1]) / 2;
}

export function WarmupScreen() {
  const { nextStep } = useArcade();
  const eye = useEyeTracking();
  const demoMode = useGazeDemo();
  const samples = useRef<Sample[]>([]);
  const targetButton = useRef<HTMLButtonElement>(null);
  const [points, setPoints] = useState<RawPoint[]>([]);
  const [demoCaptures, setDemoCaptures] = useState(0);
  const [saving, setSaving] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [error, setError] = useState('');
  const captureCount = demoMode ? demoCaptures : points.length;
  const target = targets[captureCount];

  useEffect(() => {
    samples.current = [];
    targetButton.current?.focus({ preventScroll: true });
  }, [captureCount]);

  useEffect(() => {
    const { rawX, rawY, receivedAt } = eye;
    if (!liveGaze(eye) || rawX === undefined || rawY === undefined) return;
    const previous = samples.current;
    if (previous.at(-1)?.time === receivedAt) return;
    samples.current = [...previous.filter(({ time }) => receivedAt - time <= 500), { rawX, rawY, time: receivedAt }];
  }, [eye]);

  async function capture() {
    if (saving || !target) return;
    if (demoMode) {
      const count = demoCaptures + 1;
      setDemoCaptures(count);
      if (count === targets.length) setCalibrated(true);
      playSound(count === targets.length ? 'win' : 'blip');
      return;
    }
    const now = performance.now();
    const recent = samples.current.filter(({ time }) => now - time <= 500);
    if (!liveGaze(eye) || recent.length < 5 || recent.at(-1)!.time - recent[0].time < 150) {
      setError(eye.connected && eye.rawX === undefined && !eye.isBlinking
        ? 'Update the Pi tracker to enable calibration.'
        : 'Hold your gaze on the star for a moment, then capture again.');
      return;
    }

    setError('');
    const next = [...points, {
      rawX: median(recent.map(({ rawX }) => rawX)),
      rawY: median(recent.map(({ rawY }) => rawY)),
    }];
    if (next.length < targets.length) {
      playSound('blip');
      setPoints(next);
      return;
    }

    setSaving(true);
    try {
      await sendEyeCalibration(next);
      setPoints(next);
      setCalibrated(true);
      playSound('win');
    } catch (failure) {
      setPoints([]);
      setError(failure instanceof Error ? failure.message : 'Calibration failed. Try again.');
    } finally {
      setSaving(false);
    }
  }

  const gaze = calibrated ? liveGaze(eye) : null;
  return (
    <section className="training-screen">
      <div className="training-heading">
        <h1>Eye tracking calibration</h1>
        <p className="beacon-count">{captureCount} / {targets.length}</p>
      </div>
      <p>{calibrated
        ? 'Check the gaze marker before continuing.'
        : 'Keep your head still. Look at the star for a moment, then press Enter or click the star to capture.'}</p>

      <div className="training-field" style={{ position: 'relative' }}>
        {target && (
          <button ref={targetButton} type="button" className="warmup-star" disabled={saving || (!demoMode && !eyeTrackerEnabled)}
            aria-label={`Capture gaze at the ${target.name}`}
            style={{ position: 'absolute', left: `${target.x}%`, top: `${target.y}%`, transform: 'translate(-50%, -50%)' }}
            onClick={capture}>
            ✦
          </button>
        )}
        {gaze && (
          <span aria-hidden="true" style={{
            position: 'absolute', left: `${gaze.x * 100}%`, top: `${gaze.y * 100}%`,
            transform: 'translate(-50%, -50%)', width: 24, height: 24, borderRadius: '50%',
            border: '2px solid #00E5FF', pointerEvents: 'none',
          }} />
        )}
      </div>

      <div className="training-footer">
        <p role="status">{error || (saving ? 'Saving calibration…' : !demoMode && !eyeTrackerEnabled ? 'Eye tracker is disabled.' : '')}</p>
        {calibrated ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="arcade-btn alt" onClick={() => {
              setCalibrated(false);
              setPoints([]);
              setDemoCaptures(0);
            }}>Calibrate again</button>
            <button type="button" className="arcade-btn" onClick={nextStep}>Continue</button>
          </div>
        ) : (
          <button type="button" className="arcade-btn" disabled={saving} onClick={nextStep}>Skip calibration</button>
        )}
      </div>
    </section>
  );
}
