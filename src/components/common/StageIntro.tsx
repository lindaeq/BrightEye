import { useEffect, useState, type ReactNode } from 'react';
import { Mouse } from 'lucide-react';
import { useArcadeController } from '../../context/ArcadeController';
import { useArcadeControls } from '../../utils/useArcadeControls';
import { PixelSprite } from './PixelSprite';

const demos = {
  practice: {
    title: 'Light the beacons',
    frames: [[19, 69], [30, 57], [44, 43], [61, 31], [61, 31], [61, 31]],
  },
  mission1: {
    title: 'Odd-One-Out Corners',
    frames: [[49, 53], [58, 43], [68, 33], [79, 23], [79, 23], [79, 23]],
  },
  mission2: {
    title: 'Steady Path',
    frames: [[10, 65], [23, 36], [37, 30], [51, 58], [67, 68], [86, 32]],
  },
} as const;

const stages = ['Ready?', '3', '2', '1'] as const;

function DemoStart({ onStart, mouseMode }: { onStart: () => void; mouseMode: boolean }) {
  useArcadeControls(() => {}, onStart);
  return <div className="stage-demo-start">
    <button type="button" className="arcade-btn" onClick={onStart}>Start</button>
    <p className="input-hint">{mouseMode ? 'Click Start or press Space when you’re ready.'
      : 'Press the action button, Space, or Start when you’re ready.'}</p>
  </div>;
}

export function StageIntro({ stage, children }: { stage: keyof typeof demos; children: ReactNode }) {
  const { mouseMode } = useArcadeController();
  const [step, setStep] = useState(0);
  const demo = demos[stage];
  const demoLength = demo.frames.length;
  const countdownIndex = step - demoLength;
  const showingDemo = countdownIndex < 0;
  const finished = countdownIndex >= stages.length;

  useEffect(() => {
    if (finished) return;
    const duration = showingDemo ? 820 : countdownIndex === 0 ? 700 : 1000;
    const timer = window.setTimeout(() => setStep((previous) => {
      if (!showingDemo) return previous + 1;
      return previous < demoLength ? (previous + 1) % demoLength : previous;
    }), duration);
    return () => window.clearTimeout(timer);
  }, [step, showingDemo, countdownIndex, demoLength, finished]);

  if (finished) return children;

  const frame = Math.min(step, demoLength - 1);
  const [x, y] = demo.frames[frame];
  const [previousX, previousY] = demo.frames[Math.max(0, frame - 1)];
  const horizontal = Math.sign(x - previousX);
  const vertical = Math.sign(y - previousY);
  const pressed = stage !== 'mission2' && frame >= 4;
  const instructions = stage === 'mission2'
    ? mouseMode ? 'Drag to steer along the trail.' : 'Tilt the stick to follow the trail.'
    : stage === 'practice'
      ? mouseMode ? 'Move to the ring, then click.' : 'Steer into the ring, then press the action button.'
      : mouseMode ? 'Click the star with the different color.' : 'Steer to the different star, then press the action button.';

  return (
    <section className="stage-preview" aria-labelledby="stage-preview-title">
      <p className="stage-preview-tag">{showingDemo ? 'DEMO' : 'STARTING'}</p>
      <h1 id="stage-preview-title">{demo.title}</h1>
      {showingDemo ? <>
        <p>{instructions}</p>
        <div className="stage-demo" aria-hidden="true">
          {stage === 'practice' && <span className="stage-demo-beacon" data-lit={pressed} />}
          {stage === 'mission1' && [[21, 23], [79, 23], [21, 77], [79, 77]].map(([left, top], index) => (
            <span key={index} className="stage-demo-star" data-target={index === 1} data-lit={index === 1 && pressed}
              style={{ left: `${left}%`, top: `${top}%` }}>✦</span>
          ))}
          {stage === 'mission2' && (
            <>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="stage-demo-trail">
                <polyline points={demo.frames.map((point) => point.join(',')).join(' ')} />
              </svg>
              {demo.frames.slice(1).map(([left, top], index) => (
                <span key={index} className="stage-demo-checkpoint" data-passed={index < frame}
                  style={{ left: `${left}%`, top: `${top}%` }} />
              ))}
            </>
          )}
          <span className="stage-demo-ship" data-loop-start={frame === 0} style={{ left: `${x}%`, top: `${y}%` }}>
            <PixelSprite name="ship" size={4} />
          </span>
        </div>
        <DemoStart mouseMode={mouseMode} onStart={() => setStep((previous) => Math.max(previous, demoLength))} />
        <div className="stage-demo-controls" aria-hidden="true">
          {mouseMode ? <span className="stage-demo-mouse" data-pressed={pressed || stage === 'mission2' && frame > 0}><Mouse size={26} /></span> : <>
            <span className="stage-demo-stick"><span style={{ transform: `translate(${horizontal * 10}px, ${vertical * 10}px)` }} /></span>
            <span className="stage-demo-button" data-pressed={pressed}>Press</span>
          </>}
        </div>
      </> : <p className="stage-countdown" role="status" aria-live="polite" aria-atomic="true">{stages[countdownIndex]}</p>}
    </section>
  );
}
