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
        <label htmlFor="call-sign">Call sign</label>
        <input id="call-sign" value={nickname} maxLength={16} required placeholder="e.g. Nova"
          onChange={(event) => setPlayerProfile({ ...playerProfile, nickname: event.target.value })} />
        <fieldset>
          <legend>How old are you?</legend>
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
          <label>Writing hand
            <select value={writingHand} onChange={(event) => setPlayerProfile({
              ...playerProfile, writingHand: event.target.value === 'Left' ? 'Left' : 'Right',
            })}><option>Right</option><option>Left</option></select>
          </label>
          <label>Wearing glasses?
            <select value={glasses} onChange={(event) => setPlayerProfile({
              ...playerProfile, glasses: event.target.value === 'Yes' ? 'Yes' : 'No',
            })}><option>No</option><option>Yes</option></select>
          </label>
        </div>
        <label className="pilot-consent">
          <input type="checkbox" required checked={consentAdult}
            onChange={(event) => setPlayerProfile({ ...playerProfile, consentAdult: event.target.checked })} />
          A grown-up is here and says it’s okay to play.
        </label>
        <button type="submit" className="arcade-btn">Continue</button>
      </form>
    </section>
  );
}
