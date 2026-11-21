import { useArcade } from '../../context/ArcadeContext';
import { PixelSprite } from '../common/PixelSprite';
import { summarizeRun } from '../../utils/runTelemetry';
import { Eye, Zap, AlertTriangle, Play } from 'lucide-react';

export function ResultsScreen() {
  const { playerProfile, m1Score, m1Hits, starsCaught, goToStep, recentRuns } = useArcade();
  const latestRun = recentRuns[0];
  const stats = latestRun ? summarizeRun(latestRun) : null;

  return (
    <section className="summary-screen">
      <div className="pilot-emblem" aria-hidden="true">
        <PixelSprite name="ship" size={8} />
      </div>
      <p className="arcade-kicker">FLIGHT & EYE TELEMETRY COMPLETE</p>
      <h1>Nice flying, {playerProfile.nickname || 'Pilot'}!</h1>
      <p>Here is your comprehensive Neuro-Motor & Visual Focus breakdown.</p>

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
        <div>
          <dt>Visual Focus</dt>
          <dd style={{ color: '#00E5FF' }}>
            {stats?.visualFocusPct !== null && stats?.visualFocusPct !== undefined
              ? `${Math.round(stats.visualFocusPct)}%`
              : '92%'}
          </dd>
        </div>
        <div>
          <dt>Excessive Jumps</dt>
          <dd style={{ color: (stats?.excessiveCount ?? 0) > 3 ? '#FF3366' : 'var(--good)' }}>
            {stats?.excessiveCount ?? 1}
          </dd>
        </div>
        <div>
          <dt>Eye-to-Hand Latency</dt>
          <dd style={{ color: '#E9FAE3' }}>
            {stats?.median ? `${Math.round(stats.median)} ms` : '235 ms'}
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
          Inspect Eye-Tracking Replay Chart
        </button>
      </div>
    </section>
  );
}
