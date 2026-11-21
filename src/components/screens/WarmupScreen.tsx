import { useArcade } from '../../context/ArcadeContext';

const points = [
  { left: '18%', top: '23%' }, { left: '81%', top: '24%' },
  { left: '21%', top: '77%' }, { left: '79%', top: '74%' },
  { left: '50%', top: '49%' },
];

export function WarmupScreen() {
  const { calibrationPoint, advanceCalibration, isCalibrated, nextStep } = useArcade();

  return (
    <section className="training-screen">
      <div className="training-heading">
        <div><p className="arcade-kicker">WARM-UP</p><h1>Follow the star</h1></div>
        <p className="beacon-count">{isCalibrated ? 5 : calibrationPoint - 1} / 5</p>
      </div>
      <p>Look for the glowing star and tap it when you find it.</p>
      <div className="training-field">
        {!isCalibrated && (
          <button type="button" className="warmup-star" style={points[calibrationPoint - 1]}
            onClick={advanceCalibration} aria-label={'Star ' + calibrationPoint + ' of 5'}>✦</button>
        )}
      </div>
      <div className="training-footer">
        <p role="status">{isCalibrated ? 'Nice work, pilot!' : 'Find all five stars.'}</p>
        <button type="button" className="arcade-btn" onClick={nextStep}>
          {isCalibrated ? 'Practice controls' : 'Skip warm-up'}
        </button>
      </div>
    </section>
  );
}
