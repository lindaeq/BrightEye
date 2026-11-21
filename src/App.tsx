import React from 'react';
import { useArcade } from './context/ArcadeContext';
import { TopBar } from './components/common/TopBar';
import { BottomDial } from './components/common/BottomDial';
import { StyleScreen } from './components/screens/StyleScreen';
import { StartScreen } from './components/screens/StartScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { WarmupScreen } from './components/screens/WarmupScreen';
import { HowToScreen } from './components/screens/HowToScreen';
import { Mission1Screen } from './components/screens/Mission1Screen';
import { Mission2Screen } from './components/screens/Mission2Screen';
import { ResultsScreen } from './components/screens/ResultsScreen';
import { OperatorScreen } from './components/screens/OperatorScreen';

export const AppContent: React.FC = () => {
  const { currentStep } = useArcade();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 bg-[var(--page)] transition-colors duration-200">
      
      {/* Arcade Kiosk Cabinet Body */}
      <main className="w-full max-w-5xl flex flex-col bg-[var(--body)] border-2 border-black/30 rounded-2xl md:rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] p-3 sm:p-4 md:p-5 transition-colors duration-200">
        
        {/* Top Header Bar */}
        <TopBar />

        {/* CRT Screen Frame & Bezel */}
        <div className="relative flex-1 min-h-[460px] sm:min-h-[520px] md:min-h-[580px] bg-[var(--scr)] border-[10px] sm:border-[14px] md:border-[16px] border-[var(--bezel)] rounded-xl overflow-hidden crt-screen-shadow flex flex-col my-2 transition-colors duration-200">
          
          {/* Subtle CRT Scanline Overlay */}
          <div className="absolute inset-0 scanlines-overlay z-30 pointer-events-none opacity-40" />

          {/* Screen Content Switcher */}
          <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
            {currentStep === 1 && <StyleScreen />}
            {currentStep === 2 && <StartScreen />}
            {currentStep === 3 && <ProfileScreen />}
            {currentStep === 4 && <WarmupScreen />}
            {currentStep === 5 && <HowToScreen />}
            {currentStep === 6 && <Mission1Screen />}
            {currentStep === 7 && <Mission2Screen />}
            {currentStep === 8 && <ResultsScreen />}
            {currentStep === 9 && <OperatorScreen />}
          </div>

        </div>

        {/* 9-Step Arcade Slider Dial at the Bottom */}
        <BottomDial />

      </main>

    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
