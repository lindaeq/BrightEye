import React from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { playSound } from '../../utils/audio';
import { Sparkles, ArrowRight, UserCheck } from 'lucide-react';

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
    const prefixes = ['PILOT', 'CADET', 'STAR', 'NOVA', 'EAGLE', 'COSMO'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    setPlayerProfile(prev => ({ ...prev, nickname: `${prefix}_${num}` }));
  };

  return (
    <div className="flex flex-col h-full justify-between gap-4 p-6 sm:p-8 overflow-y-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between font-terminal text-xl text-[var(--dim)] border-b border-[var(--line)] pb-2 font-semibold">
        <span>Step 3 of 9 · Player Setup</span>
        <span className="flex items-center gap-1.5 text-emerald-500 font-pixel text-xs">
          <UserCheck className="w-4 h-4" /> Ready to Configure
        </span>
      </div>

      {/* Main Form */}
      <div className="grid md:grid-cols-[1.8fr_1fr] gap-6 sm:gap-8 flex-1 items-center max-w-5xl mx-auto w-full my-auto">
        
        {/* Left Column: Big Questions */}
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="space-y-1">
            <h1 className="font-pixel text-xl sm:text-3xl text-[var(--ink)] font-black tracking-tight">
              WHO’S PLAYING?
            </h1>
            <p className="font-terminal text-2xl text-[var(--dim)]">
              Answer 4 quick questions to calibrate for your age.
            </p>
          </div>

          {/* 1. Nickname */}
          <div className="space-y-1">
            <label className="font-pixel text-xs uppercase tracking-wider text-[var(--ink)] font-bold block">
              1. Cadet Nickname
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={playerProfile.nickname}
                onChange={(e) => setPlayerProfile(prev => ({ ...prev, nickname: e.target.value.toUpperCase().slice(0, 12) }))}
                className="border-3 border-[var(--ink)] bg-[var(--scr)] px-4 py-2 font-pixel text-sm sm:text-base text-[var(--ink)] rounded-xl focus:outline-none focus:ring-4 focus:ring-[var(--glow-color)] uppercase w-64 tracking-wider shadow-sm font-bold"
              />
              <button
                type="button"
                onClick={handleRandomizeNick}
                className="arcade-btn alt font-pixel text-[10px] py-2 px-3 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--btn)]" />
                <span>Random</span>
              </button>
            </div>
          </div>

          {/* 2. Age Group */}
          <div className="space-y-1.5">
            <label className="font-pixel text-xs uppercase tracking-wider text-[var(--ink)] font-bold block">
              2. Age Group
            </label>
            <div className="flex flex-wrap gap-2.5">
              {['5–7', '8–10', '11–13', '14–17'].map((age) => {
                const isSelected = playerProfile.ageGroup === age;
                return (
                  <button
                    key={age}
                    type="button"
                    onClick={() => handleChipSelect('ageGroup', age)}
                    className={`px-5 py-2 font-pixel text-xs sm:text-sm rounded-xl border-3 transition-all cursor-pointer select-none font-bold shadow-sm ${
                      isSelected
                        ? 'bg-[var(--btn)] text-[var(--btnink)] border-[var(--btn)] shadow-lg scale-105'
                        : 'border-[var(--dim)] text-[var(--ink)] hover:border-[var(--ink)] bg-[var(--fld)]'
                    }`}
                  >
                    {age} Years
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Handedness & Glasses */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Writing Hand */}
            <div className="space-y-1.5">
              <label className="font-pixel text-xs uppercase tracking-wider text-[var(--ink)] font-bold block">
                3. Writing Hand
              </label>
              <div className="flex gap-2">
                {(['Left', 'Right'] as const).map((hand) => {
                  const isSelected = playerProfile.writingHand === hand;
                  return (
                    <button
                      key={hand}
                      type="button"
                      onClick={() => handleChipSelect('writingHand', hand)}
                      className={`flex-1 px-4 py-2 font-pixel text-xs sm:text-sm rounded-xl border-2 transition-all cursor-pointer font-bold ${
                        isSelected
                          ? 'bg-[var(--btn)] text-[var(--btnink)] border-[var(--btn)] shadow-md'
                          : 'border-[var(--dim)] text-[var(--ink)] hover:border-[var(--ink)] bg-[var(--fld)]'
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
              <label className="font-pixel text-xs uppercase tracking-wider text-[var(--ink)] font-bold block">
                4. Glasses?
              </label>
              <div className="flex gap-2">
                {(['No', 'Yes'] as const).map((gl) => {
                  const isSelected = playerProfile.glasses === gl;
                  return (
                    <button
                      key={gl}
                      type="button"
                      onClick={() => handleChipSelect('glasses', gl)}
                      className={`flex-1 px-4 py-2 font-pixel text-xs sm:text-sm rounded-xl border-2 transition-all cursor-pointer font-bold ${
                        isSelected
                          ? 'bg-[var(--btn)] text-[var(--btnink)] border-[var(--btn)] shadow-md'
                          : 'border-[var(--dim)] text-[var(--ink)] hover:border-[var(--ink)] bg-[var(--fld)]'
                      }`}
                    >
                      {gl}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Consent Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-[var(--line)] bg-[var(--fld)] cursor-pointer select-none hover:border-[var(--ink)] transition-colors">
              <input
                type="checkbox"
                checked={playerProfile.consentAdult}
                onChange={(e) => setPlayerProfile(prev => ({ ...prev, consentAdult: e.target.checked }))}
                className="w-5 h-5 accent-[var(--btn)] rounded cursor-pointer"
              />
              <span className="font-terminal text-2xl font-bold text-[var(--ink)]">
                A grown-up is present &amp; agreed to the eye-hand check
              </span>
            </label>
          </div>
        </div>

        {/* Right Column: Context */}
        <div className="flex flex-col gap-4">
          <div className="border-3 border-[var(--dim)] bg-[var(--fld)] rounded-2xl p-6 space-y-3 shadow-md">
            <h2 className="font-pixel text-xs font-bold text-[var(--ink)] border-b border-[var(--line)] pb-2">
              CLINICAL BENCHMARK
            </h2>
            <p className="font-terminal text-2xl text-[var(--ink)] leading-snug">
              Reaction time and motor tremor vary by age. Your nickname and age group are matched to pediatric standards.
            </p>
            <div className="text-[var(--good)] font-terminal text-xl font-bold pt-2 border-t border-[var(--line)] flex items-center gap-2">
              <span>✓ 100% Offline QNX Edge Video Processing</span>
            </div>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--line)]">
        <span className="font-terminal text-2xl font-semibold text-[var(--dim)]">
          Cadet: <b className="text-[var(--ink)]">{playerProfile.nickname} ({playerProfile.ageGroup}y)</b>
        </span>

        <button
          onClick={nextStep}
          disabled={!playerProfile.consentAdult}
          className="arcade-btn glow-guide px-8 py-3.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2.5 text-xs sm:text-sm"
        >
          <span>NEXT: EYE CALIBRATION</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
