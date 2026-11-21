import React from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { playSound } from '../../utils/audio';

export const ProfileScreen: React.FC = () => {
  const { playerProfile, setPlayerProfile, nextStep } = useArcade();

  const handleChipSelect = <K extends keyof typeof playerProfile>(
    key: K,
    value: typeof playerProfile[K]
  ) => {
    playSound('step');
    setPlayerProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleRandomizeNick = () => {
    playSound('step');
    const num = Math.floor(Math.random() * 900 + 100);
    const prefixes = ['PILOT', 'CADET', 'STAR', 'NOVA', 'EAGLE'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    setPlayerProfile(prev => ({ ...prev, nickname: `${prefix}_${num}` }));
  };

  return (
    <div className="flex flex-col h-full justify-between gap-4 p-4 sm:p-6 overflow-y-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between font-terminal text-xs sm:text-sm text-[var(--dim)] uppercase tracking-wider border-b border-[var(--line)] pb-1">
        <span>Player setup</span>
        <span>Step 3 of 9</span>
      </div>

      {/* 2-Column Form */}
      <div className="grid md:grid-cols-[1.7fr_1fr] gap-4 sm:gap-6 flex-1 items-start my-auto">
        
        {/* Left Column: Profile Controls */}
        <div className="flex flex-col gap-4">
          <h1 className="font-pixel text-base sm:text-xl text-[var(--a1)]">
            WHO’S PLAYING?
          </h1>

          {/* Nickname */}
          <div className="space-y-1">
            <label className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] block">
              Cadet Nickname (Click to Edit)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={playerProfile.nickname}
                onChange={(e) => setPlayerProfile(prev => ({ ...prev, nickname: e.target.value.toUpperCase().slice(0, 12) }))}
                className="border-2 border-[var(--ink)] bg-[var(--scr)] px-3 py-1 font-terminal text-base sm:text-lg text-[var(--ink)] rounded-[var(--r)] focus:outline-none focus:border-[var(--a1)] uppercase w-48"
              />
              <button
                type="button"
                onClick={handleRandomizeNick}
                className="arcade-btn alt font-terminal text-xs py-1 px-2.5"
              >
                Randomize
              </button>
            </div>
          </div>

          {/* Age Group Chips */}
          <div className="space-y-1.5">
            <label className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] block">
              Age group
            </label>
            <div className="flex flex-wrap gap-2">
              {['5–7', '8–10', '11–13', '14–17'].map((age) => {
                const isSelected = playerProfile.ageGroup === age;
                return (
                  <button
                    key={age}
                    type="button"
                    onClick={() => handleChipSelect('ageGroup', age)}
                    className={`px-3 py-1 font-terminal text-sm sm:text-base rounded-[var(--r)] border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--a1)] text-[var(--on)] border-[var(--a1)] font-bold'
                        : 'border-[var(--dim)] text-[var(--ink)] hover:border-[var(--ink)]'
                    }`}
                  >
                    {age}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Handedness & Glasses */}
          <div className="flex flex-wrap gap-6">
            {/* Writing Hand */}
            <div className="space-y-1.5">
              <label className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] block">
                Writing hand
              </label>
              <div className="flex gap-2">
                {(['Left', 'Right'] as const).map((hand) => {
                  const isSelected = playerProfile.writingHand === hand;
                  return (
                    <button
                      key={hand}
                      type="button"
                      onClick={() => handleChipSelect('writingHand', hand)}
                      className={`px-3 py-1 font-terminal text-sm sm:text-base rounded-[var(--r)] border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--a1)] text-[var(--on)] border-[var(--a1)] font-bold'
                          : 'border-[var(--dim)] text-[var(--ink)] hover:border-[var(--ink)]'
                      }`}
                    >
                      {hand}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Glasses */}
            <div className="space-y-1.5">
              <label className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] block">
                Glasses
              </label>
              <div className="flex gap-2">
                {(['No', 'Yes'] as const).map((gl) => {
                  const isSelected = playerProfile.glasses === gl;
                  return (
                    <button
                      key={gl}
                      type="button"
                      onClick={() => handleChipSelect('glasses', gl)}
                      className={`px-3 py-1 font-terminal text-sm sm:text-base rounded-[var(--r)] border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--a1)] text-[var(--on)] border-[var(--a1)] font-bold'
                          : 'border-[var(--dim)] text-[var(--ink)] hover:border-[var(--ink)]'
                      }`}
                    >
                      {gl}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-2 pt-1 font-terminal text-sm sm:text-base text-[var(--ink)]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={playerProfile.consentAdult}
                onChange={(e) => setPlayerProfile(prev => ({ ...prev, consentAdult: e.target.checked }))}
                className="w-4 h-4 accent-[var(--a1)]"
              />
              <span>A grown-up said OK (Parent / Staff consent)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={playerProfile.consentPrivacy}
                onChange={(e) => setPlayerProfile(prev => ({ ...prev, consentPrivacy: e.target.checked }))}
                className="w-4 h-4 accent-[var(--a1)]"
              />
              <span>I know the camera runs offline & never saves video</span>
            </label>
          </div>
        </div>

        {/* Right Column: Privacy & Clinical Info */}
        <div className="flex flex-col gap-3">
          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-4 space-y-2">
            <div className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] font-bold border-b border-[var(--line)] pb-1">
              Why we ask
            </div>
            <p className="font-terminal text-sm sm:text-base text-[var(--dim)] leading-relaxed">
              Age and hand help us compare your scores with kids your age. Pediatric norms differ across developmental stages.
            </p>
            <p className="font-terminal text-xs text-[var(--dim)] leading-relaxed pt-1">
              Protected by QNX RTOS edge processing: coordinates are calculated in RAM and raw video is immediately discarded.
            </p>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
        <span className="font-terminal text-xs text-[var(--dim)]">
          Pilot: <b className="text-[var(--ink)]">{playerProfile.nickname} ({playerProfile.ageGroup}y)</b>
        </span>
        <button
          onClick={nextStep}
          disabled={!playerProfile.consentAdult || !playerProfile.consentPrivacy}
          className="arcade-btn font-pixel text-xs px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          NEXT: WARM-UP →
        </button>
      </div>

    </div>
  );
};
