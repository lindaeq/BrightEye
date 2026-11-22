import { useArcade } from '../../context/ArcadeContext';
import { PixelSprite } from '../common/PixelSprite';

export function ResultsScreen() {
  const { playerProfile, goToStep } = useArcade();

  return (
    <section className="summary-screen">
      <div className="pilot-emblem" aria-hidden="true">
        <PixelSprite name="ship" size={8} />
      </div>
      <p className="arcade-kicker">FLIGHT COMPLETE</p>
      <h1>Nice flying, {playerProfile.nickname || 'Pilot'}!</h1>

      {/* Action Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 18 }}>
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
