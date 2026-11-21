import React, { useState } from 'react';
import { useArcade } from './context/ArcadeContext';
import { TopBar } from './components/common/TopBar';
import { VerticalStepper } from './components/common/VerticalStepper';
import { CameraFeed } from './components/common/CameraFeed';
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
  const [stepsOpen, setStepsOpen] = useState<boolean>(false);

  return (
    <div className="h-screen w-screen flex flex-col p-2 sm:p-3 bg-[var(--page)] transition-colors duration-200 overflow-hidden select-none">
      
      {/* Main Arcade Cabinet Body */}
      <main className="w-full flex-1 flex flex-col bg-[var(--body)] border-2 border-black/40 rounded-2xl shadow-2xl transition-colors duration-200 overflow-hidden min-h-0">
        
        {/* Top Header Bar with Steps toggle */}
        <TopBar onToggleSteps={() => setStepsOpen(!stepsOpen)} stepsOpen={stepsOpen} />

        {/* Center Container: Vertical Stepper (when open) + CRT Screen */}
        <div className="relative flex-1 flex overflow-hidden min-h-0">
          
          {/* Toggleable Vertical Steps Rail */}
          <VerticalStepper isOpen={stepsOpen} onClose={() => setStepsOpen(false)} />

          {/* CRT Screen Frame & Bezel */}
          <div className="relative flex-1 bg-[var(--scr)] border-[10px] sm:border-[12px] border-[var(--bezel)] rounded-b-xl overflow-hidden crt-shadow flex flex-col transition-colors duration-200 min-h-0">
            
            {/* Subtle, pale scanline overlay */}
            <div className="absolute inset-0 scanlines-subtle z-30 pointer-events-none opacity-25" />

            {/* Smart Interactive Camera Feed */}
            <CameraFeed />

            {/* Active Screen View */}
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

        </div>

      </main>

    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
