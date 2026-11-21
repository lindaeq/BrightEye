import { useArcade } from '../../context/ArcadeContext';
import { PixelSprite } from '../common/PixelSprite';

export function ProfileScreen() {
  const { playerProfile, setPlayerProfile, nextStep } = useArcade();
  const { nickname, ageGroup, writingHand, glasses, consentAdult } = playerProfile;

  return (
    <section className="pilot-screen">
      <div className="pilot-intro">
        <div className="pilot-emblem" aria-hidden="true"><PixelSprite name="inv" size={7} /></div>
        <p className="arcade-kicker">PILOT CHECK-IN</p>
        <h1>Who’s playing?</h1>
        <p>Pick a call sign for your flight.</p>
      </div>
      <form className="pilot-form" onSubmit={(event) => {
        event.preventDefault();
        if (!nickname.trim() || !ageGroup || !consentAdult) return;
        setPlayerProfile({ ...playerProfile, nickname: nickname.trim() });
        nextStep();
      }}>
        <div className="pilot-field">
          <label className="pilot-field-label" htmlFor="call-sign">Call sign</label>
          <input id="call-sign" value={nickname} maxLength={16} required placeholder="e.g. Nova"
            onChange={(event) => setPlayerProfile({ ...playerProfile, nickname: event.target.value })} />
        </div>
        <fieldset className="pilot-age">
          <legend className="pilot-field-label">How old are you?</legend>
          <div className="pilot-options">
            {['5–7', '8–10', '11–13', '14–17'].map((age) => (
              <label key={age}>
                <input type="radio" name="age" value={age} required checked={ageGroup === age}
                  onChange={() => setPlayerProfile({ ...playerProfile, ageGroup: age })} />
                <span>{age}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="pilot-details">
          <label className="pilot-field"><span className="pilot-field-label">Writing hand</span>
            <select value={writingHand} onChange={(event) => setPlayerProfile({
              ...playerProfile, writingHand: event.target.value === 'Left' ? 'Left' : 'Right',
            })}><option>Right</option><option>Left</option></select>
          </label>
          <label className="pilot-field"><span className="pilot-field-label">Wearing glasses?</span>
            <select value={glasses} onChange={(event) => setPlayerProfile({
              ...playerProfile, glasses: event.target.value === 'Yes' ? 'Yes' : 'No',
            })}><option>No</option><option>Yes</option></select>
          </label>
        </div>
        <label className="pilot-field pilot-consent">
          <input type="checkbox" required checked={consentAdult}
            onChange={(event) => setPlayerProfile({ ...playerProfile, consentAdult: event.target.checked })} />
          A grown-up is here and says it’s okay to play.
        </label>
        <p className="input-hint">Scores and control movements stay in this tab for replay and can be exported from the operator view. The game does not record camera video.</p>
        <button type="submit" className="arcade-btn">Continue</button>
      </form>
    </section>
  );
}
