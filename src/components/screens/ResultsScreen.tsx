import { useArcade } from '../../context/ArcadeContext';
import { PixelSprite } from '../common/PixelSprite';
import { summarizeRun } from '../../utils/runTelemetry';

export function ResultsScreen() {
  const { playerProfile, m1Score, m1Hits, starsCaught, goToStep, latestRun } = useArcade();
  const stats = latestRun ? summarizeRun(latestRun) : null;

  return (
    <section className="summary-screen">
      <div className="pilot-emblem" aria-hidden="true">
        <PixelSprite name="ship" size={8} />
      </div>
      <p className="arcade-kicker">FLIGHT COMPLETE</p>
      <h1>Nice flying, {playerProfile.nickname || 'Pilot'}!</h1>

      {/* Main Core Scores */}
      <dl className="flight-results" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <div>
          <dt>Targets Hit</dt>
          <dd>{m1Hits}</dd>
        </div>
        <div>
          <dt>Stars Caught</dt>
          <dd>{starsCaught}</dd>
        </div>
        <div><dt>Odd-one-out score</dt><dd>{m1Score}</dd></div>
        <div>
          <dt>Wrong-corner clicks</dt>
          <dd>{stats?.decoys ?? '—'}</dd>
        </div>
        <div>
          <dt>Flash-to-gaze</dt>
          <dd>{stats?.gazeLatencyMedian != null ? `${Math.round(stats.gazeLatencyMedian)} ms` : '—'}</dd>
        </div>
        <div><dt>Off-trail deviation</dt><dd>{stats?.trailDeviation != null ? `${stats.trailDeviation.toFixed(1)}%` : '—'}</dd></div>
        <div><dt>Joystick jitter</dt><dd>{stats?.joystickJitter != null ? `${stats.joystickJitter.toFixed(1)}%` : '—'}</dd></div>
        <div><dt>Gaze lead</dt><dd>{stats?.eyeHandLead != null ? `${stats.eyeHandLead.toFixed(1)}%` : '—'}</dd></div>
        <div>
          <dt>Eye-to-Hand Latency</dt>
          <dd style={{ color: '#E9FAE3' }}>
            {stats?.eyeToHandMedian != null ? `${Math.round(stats.eyeToHandMedian)} ms` : '—'}
          </dd>
        </div>
      </dl>

      {/* Action Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 12 }}>
        <button type="button" className="arcade-btn" onClick={() => goToStep('start')}>
          Play Again
        </button>
        <button
          type="button"
          className="arcade-btn alt"
          style={{ borderColor: '#00E5FF', color: '#00E5FF' }}
          onClick={() => goToStep('operator')}
        >
          Operator view
        </button>
      </div>
    </section>
  );
}
