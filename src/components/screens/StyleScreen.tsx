import React from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { Check } from 'lucide-react';

interface ThemeDefinition {
  id: number;
  name: string;
  body: string;
  bezel: string;
  scr: string;
  ink: string;
  good: string;
  bad: string;
}

const THEMES: ThemeDefinition[] = [
  { id: 1, name: 'Moon Rock', body: '#dfe3e8', bezel: '#4a5260', scr: '#cfd8e0', ink: '#1a2430', good: '#1f5f8b', bad: '#b03a2e' },
  { id: 2, name: 'Sunset', body: '#2b2b2b', bezel: '#0c0c0c', scr: '#17140d', ink: '#ffc247', good: '#ffd36b', bad: '#ff7350' },
  { id: 3, name: 'Deep Sea', body: '#c9ced6', bezel: '#2b3140', scr: '#0f1b2d', ink: '#eaf2ff', good: '#7cc4ff', bad: '#ff8a7a' },
  { id: 4, name: 'Cloud', body: '#e8e4d8', bezel: '#6b6a66', scr: '#f1efe6', ink: '#111111', good: '#111111', bad: '#c2342b' },
  { id: 5, name: 'Comet', body: '#3b3b41', bezel: '#18181b', scr: '#26262b', ink: '#f2f2f2', good: '#f2c14e', bad: '#ff7a6b' },
  { id: 6, name: 'Neon', body: '#0d0716', bezel: '#5b34b8', scr: '#110a1e', ink: '#f7eefc', good: '#ff5db1', bad: '#b99cff' },
];

export const StyleScreen: React.FC = () => {
  const { themeId, setThemeId, nextStep } = useArcade();

  return (
    <div className="flex flex-col h-full justify-between gap-4 p-4 sm:p-6 overflow-y-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center justify-between font-terminal text-xs sm:text-sm text-[var(--dim)] uppercase tracking-wider mb-1">
          <span>Make it yours</span>
          <span>Step 1 of 9</span>
        </div>
        <h1 className="font-pixel text-base sm:text-xl text-[var(--a1)] tracking-wide">
          PICK YOUR LOOK
        </h1>
        <p className="font-terminal text-sm text-[var(--dim)] mt-1">
          Select an authentic retro cabinet color palette for your neuro-arcade session.
        </p>
      </div>

      {/* 6 Themes Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 my-auto">
        {THEMES.map((t) => {
          const isSelected = themeId === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setThemeId(t.id)}
              style={{ backgroundColor: t.body }}
              className={`tc-button relative p-2.5 rounded-lg border-2 transition-all group ${
                isSelected
                  ? 'border-[var(--a1)] shadow-[0_0_15px_rgba(0,0,0,0.4)] scale-[1.02]'
                  : 'border-transparent hover:border-black/20 opacity-90 hover:opacity-100'
              }`}
            >
              <div
                style={{
                  backgroundColor: t.scr,
                  borderColor: t.bezel,
                  color: t.ink,
                }}
                className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded border-2 min-h-[90px] sm:min-h-[110px]"
              >
                {/* Palette color dots */}
                <div className="flex items-center gap-2">
                  <span
                    style={{ backgroundColor: t.good }}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-sm"
                  />
                  <span
                    style={{ backgroundColor: t.bad }}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm shadow-sm"
                  />
                  <span
                    style={{ backgroundColor: t.ink }}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded shadow-sm opacity-80"
                  />
                </div>

                {/* Theme Name */}
                <div className="flex items-center gap-1.5 font-terminal text-base sm:text-lg font-bold">
                  <span>{t.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-[var(--good)]" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
        <span className="font-terminal text-xs text-[var(--dim)]">
          Selected Theme: <b className="text-[var(--ink)]">{THEMES.find(t => t.id === themeId)?.name}</b>
        </span>
        <button
          onClick={nextStep}
          className="arcade-btn font-pixel text-xs px-5 py-2.5"
        >
          LOOKS GOOD! →
        </button>
      </div>

    </div>
  );
};
