import { useState, useEffect, useRef } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { useEyeTracking, sendEyeCalibration } from '../../utils/useEyeTracking';
import { playSound } from '../../utils/audio';
import { Eye, CheckCircle2, Target } from 'lucide-react';

const CALIBRATION_STEPS = [
  { id: 1, name: 'TOP-RIGHT', left: '84%', top: '18%', x: 0.84, y: 0.18 },
  { id: 2, name: 'TOP-LEFT', left: '16%', top: '18%', x: 0.16, y: 0.18 },
  { id: 3, name: 'BOTTOM-RIGHT', left: '84%', top: '82%', x: 0.84, y: 0.82 },
  { id: 4, name: 'BOTTOM-LEFT', left: '16%', top: '82%', x: 0.16, y: 0.82 },
  { id: 5, name: 'CENTER', left: '50%', top: '50%', x: 0.50, y: 0.50 },
];

export function WarmupScreen() {
  const { isCalibrated, advanceCalibration, nextStep } = useArcade();
  const eye = useEyeTracking();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [dwellProgress, setDwellProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Collected range calibration bounds
  const recordedPoints = useRef<{ x: number; y: number }[]>([]);

  const currentTarget = CALIBRATION_STEPS[currentStepIndex];

  // Dwell detection: automatically advances when player holds gaze on the star
  useEffect(() => {
    if (isFinished || !currentTarget) return;

    let dwellTimer: number;
    const checkGazeDwell = () => {
      if (eye.connected && !eye.isBlinking) {
        const dist = Math.hypot(eye.gazeX - currentTarget.x, eye.gazeY - currentTarget.y);
        if (dist <= 0.24) {
          setDwellProgress((prev) => {
            const next = prev + 12;
            if (next >= 100) {
              handleLockPoint();
              return 0;
            }
            return next;
          });
          return;
        }
      }
      setDwellProgress((prev) => Math.max(0, prev - 8));
    };

    dwellTimer = window.setInterval(checkGazeDwell, 50);
    return () => window.clearInterval(dwellTimer);
  }, [currentStepIndex, isFinished, eye.gazeX, eye.gazeY, eye.connected, eye.isBlinking, currentTarget]);

  function handleLockPoint() {
    playSound('blip');
    recordedPoints.current.push({ x: eye.gazeX, y: eye.gazeY });

    if (currentStepIndex < CALIBRATION_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      advanceCalibration();
    } else {
      // Completed all 4 corners + center!
      setIsFinished(true);
      playSound('win');
      advanceCalibration();

      // Send exact range bounds to Raspberry Pi 5 engine
      const xs = recordedPoints.current.map((p) => p.x);
      const ys = recordedPoints.current.map((p) => p.y);
      sendEyeCalibration({
        minX: Math.min(...xs, 0.35),
        maxX: Math.max(...xs, 0.65),
        minY: Math.min(...ys, 0.40),
        maxY: Math.max(...ys, 0.55),
      });
    }
  }

  return (
    <section className="training-screen">
      <div className="training-heading">
        <div>
          <p className="arcade-kicker">STEP 3 OF 6: OCULOMOTOR RANGE CALIBRATION</p>
          <h1>Eye Tracking 4-Corner Calibration</h1>
        </div>
        <p className="beacon-count" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={18} color="#00E5FF" />
          <span>{isFinished ? '5 / 5' : `${currentStepIndex + 1} / 5`}</span>
        </p>
      </div>

      <p>
        {!isFinished ? (
          <>
            Look directly at the glowing star in the{' '}
            <strong style={{ color: '#00E5FF', textTransform: 'uppercase' }}>
              {currentTarget?.name}
            </strong>{' '}
            corner to verify your full range of motion.
          </>
        ) : (
          <span style={{ color: 'var(--good)' }}>
            ✓ Full 2D Eye Range of Motion Calibrated! Top, bottom, left, and right bounds verified.
          </span>
        )}
      </p>

      {/* Calibration Field */}
      <div className="training-field" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Live Eye Reticle (Cyan) */}
        {eye.connected && !eye.isBlinking && (
          <div
            style={{
              position: 'absolute',
              left: `${eye.gazeX * 100}%`,
              top: `${eye.gazeY * 100}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 20,
              transition: 'left 0.04s linear, top 0.04s linear',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '2px solid #00E5FF',
                boxShadow: '0 0 10px #00E5FF',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00E5FF' }} />
            </div>
            <span style={{ fontSize: '9px', color: '#00E5FF', marginLeft: 16, fontFamily: 'monospace' }}>
              EYE
            </span>
          </div>
        )}

        {/* Current Active Target Star */}
        {!isFinished && currentTarget && (
          <button
            type="button"
            className="warmup-star"
            style={{
              position: 'absolute',
              left: currentTarget.left,
              top: currentTarget.top,
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: `0 0 ${15 + dwellProgress * 0.3}px #00E5FF`,
            }}
            onClick={handleLockPoint}
            aria-label={`Look at ${currentTarget.name}`}
          >
            ✦
          </button>
        )}

        {/* Visual Target Ring with Dwell Indicator */}
        {!isFinished && currentTarget && (
          <div
            style={{
              position: 'absolute',
              left: currentTarget.left,
              top: currentTarget.top,
              transform: 'translate(-50%, -50%)',
              width: 54,
              height: 54,
              borderRadius: '50%',
              border: '2px dashed rgba(0, 229, 255, 0.4)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      <div className="training-footer">
        <p role="status">
          {!isFinished ? (
            <span>
              Hold your gaze on the star or click/tap it to lock. (Progress:{' '}
              <strong style={{ color: '#00E5FF' }}>{dwellProgress}%</strong>)
            </span>
          ) : (
            'Range of motion complete! Ready for Target Lock.'
          )}
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          {!isFinished && (
            <button type="button" className="arcade-btn alt" onClick={handleLockPoint}>
              Lock {currentTarget?.name}
            </button>
          )}
          <button type="button" className="arcade-btn" onClick={nextStep}>
            {isFinished ? 'Start Missions' : 'Skip Calibration'}
          </button>
        </div>
      </div>
    </section>
  );
}
