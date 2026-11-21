import { useArcade } from '../../context/ArcadeContext';
import { PixelSprite } from '../common/PixelSprite';

export function ResultsScreen() {
  const { playerProfile, m1Score, m1Hits, starsCaught, goToStep, resetCalibration, resetMission1, resetMission2 } = useArcade();

  function playAgain() {
    resetCalibration();
    resetMission1();
    resetMission2();
    goToStep('start');
  }

  return (
    <section className="summary-screen">
      <div className="pilot-emblem" aria-hidden="true"><PixelSprite name="ship" size={8} /></div>
      <p className="arcade-kicker">FLIGHT COMPLETE</p>
      <h1>Nice flying, {playerProfile.nickname}!</h1>
      <p>Here’s how your two missions went.</p>
      <dl className="flight-results">
        <div><dt>Targets hit</dt><dd>{m1Hits}</dd></div>
        <div><dt>Target lock score</dt><dd>{m1Score}</dd></div>
        <div><dt>Stars caught</dt><dd>{starsCaught}</dd></div>
      </dl>
      <button type="button" className="arcade-btn" onClick={playAgain}>Play again</button>
      <button type="button" className="arcade-text-button" onClick={() => goToStep('operator')}>Operator view</button>
    </section>
  );
}
