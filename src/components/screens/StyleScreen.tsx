import React from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

interface ThemeDefinition {
  id: number;
  name: string;
  category: string;
  body: string;
  bezel: string;
  scr: string;
  ink: string;
  colors: string[]; // 4 vibrant colors shown to kids
}

const THEMES: ThemeDefinition[] = [
  {
    id: 1,
    name: 'Candy Pastel',
    category: 'Playful & Bright',
    body: '#e0e7ff',
    bezel: '#a5b4fc',
    scr: '#ffffff',
    ink: '#1e1b4b',
    colors: ['#6366f1', '#10b981', '#ec4899', '#f59e0b'],
  },
  {
    id: 2,
    name: 'Muted Retro Pastel',
    category: 'Warm & Calming',
    body: '#cbd5e1',
    bezel: '#64748b',
    scr: '#f8fafc',
    ink: '#0f172a',
    colors: ['#0d9488', '#f43f5e', '#d97706', '#0284c7'],
  },
  {
    id: 3,
    name: 'Cyber Neon',
    category: 'Ruby-Red & Electric',
    body: '#160c2e',
    bezel: '#4c1d95',
    scr: '#0f0724',
    ink: '#ffffff',
    colors: ['#ff004f', '#00f5ff', '#ffb700', '#00ff88'], // Vivid Ruby-Red!
  },
  {
    id: 4,
    name: 'Space Arcade',
    category: 'Cosmic Galaxy',
    body: '#111a2e',
    bezel: '#1e293b',
    scr: '#0b1222',
    ink: '#ffffff',
    colors: ['#0284c7', '#38bdf8', '#fbbf24', '#f43f5e'],
  },
  {
    id: 5,
    name: 'Sunset Horizon',
    category: 'Radiant Dusk',
    body: '#231c38',
    bezel: '#3b2f5c',
    scr: '#19142b',
    ink: '#ffffff',
    colors: ['#f97316', '#facc15', '#fb7185', '#60a5fa'],
  },
  {
    id: 6,
    name: 'Pixel Play',
    category: 'Clean with Pop Accents',
    body: '#f8fafc',
    bezel: '#334155',
    scr: '#ffffff',
    ink: '#09090b',
    colors: ['#2563eb', '#059669', '#ec4899', '#ea580c'],
  },
];

export const StyleScreen: React.FC = () => {
  const { themeId, setThemeId, nextStep } = useArcade();

  return (
    <div className="flex flex-col h-full justify-between gap-4 p-6 sm:p-8 overflow-y-auto">
      
      {/* Header with High-Contrast Typography */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--fld)] text-[var(--btn)] text-xs font-bold uppercase tracking-wider mb-1 border border-[var(--line)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Kid-Friendly Arcade Themes</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl text-[var(--ink)] font-extrabold tracking-tight">
          Choose Your Theme
        </h1>
        <p className="font-ui text-base sm:text-lg text-[var(--dim)] mt-1">
          Pick your favorite color palette to make the kiosk yours.
        </p>
      </div>

      {/* 6 Multi-Color Theme Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 my-auto max-w-5xl mx-auto w-full">
        {THEMES.map((t) => {
          const isSelected = themeId === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setThemeId(t.id)}
              style={{ backgroundColor: t.body }}
              className={`p-4 rounded-2xl border-3 transition-all cursor-pointer shadow-md hover:scale-[1.02] flex flex-col justify-between text-left ${
                isSelected
                  ? 'border-[var(--btn)] ring-4 ring-[var(--glow-color)] scale-[1.03]'
                  : 'border-black/20 hover:border-black/40'
              }`}
            >
              <div
                style={{
                  backgroundColor: t.scr,
                  borderColor: t.bezel,
                  color: t.ink,
                }}
                className="flex flex-col justify-between p-4 rounded-xl border-2 min-h-[120px] w-full"
              >
                {/* 4 Multi-Color Kid Swatches */}
                <div className="flex items-center gap-2">
                  {t.colors.map((c, i) => (
                    <span
                      key={i}
                      style={{ backgroundColor: c }}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-md border-2 border-white/40"
                    />
                  ))}
                </div>

                {/* Theme Name & Category */}
                <div className="mt-3">
                  <div className="font-heading text-lg sm:text-xl font-bold flex items-center justify-between">
                    <span>{t.name}</span>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-[var(--btn)] text-[var(--btnink)] flex items-center justify-center text-xs shadow">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <span className="font-ui text-xs font-semibold opacity-75 block">
                    {t.category}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Footer with Guiding Glowing Button */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--line)]">
        <span className="font-ui text-base font-semibold text-[var(--dim)]">
          Selected Theme: <b className="text-[var(--ink)]">{THEMES.find(t => t.id === themeId)?.name}</b>
        </span>

        {/* Guiding glowing path animation */}
        <button
          onClick={nextStep}
          className="arcade-btn glow-guide flex items-center gap-2"
        >
          <span>LOOKS GOOD</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
