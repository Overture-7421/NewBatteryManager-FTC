import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import '@/app.css';
import Sidebar from '@/components/Sidebar.jsx';
import BatteriesView from '@/components/BatteriesView.jsx';
import MatchesView from '@/components/MatchesView.jsx';
import BorrowedView from '@/components/BorrowedView.jsx';
import SettingsView from '@/components/SettingsView.jsx';
import InfoView from '@/components/InfoView.jsx';
import IntroOverlay from '@/components/IntroOverlay.jsx';
import { Toaster } from 'sonner';

function App() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const clearedFlag = localStorage.getItem('overtureDataCleared');
    if (!clearedFlag) {
      const keysToClear = [
        'batteries',
        'matches',
        'matchMode',
        'borrowedItems',
        'ftc_batteries',
        'ftc_borrowed_items',
      ];
      keysToClear.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem('overtureDataCleared', 'true');
    }

    const setColorsForButton = (button) => {
      const baseHue = 262 + (Math.random() * 8 - 4);
      const accentHue = 272 + (Math.random() * 8 - 4);
      const lightnessA = 64 + Math.random() * 6;
      const lightnessB = 52 + Math.random() * 6;
      const lightnessC = 70 + Math.random() * 5;

      button.style.setProperty('--btn-a', `hsl(${baseHue} 78% ${lightnessA}%)`);
      button.style.setProperty('--btn-b', `hsl(${accentHue} 74% ${lightnessB}%)`);
      button.style.setProperty('--btn-c', `hsl(${baseHue} 80% ${lightnessC}%)`);
    };

    const updateAllButtons = () => {
      const buttons = document.querySelectorAll('.btn-primary');
      buttons.forEach((button) => setColorsForButton(button));
    };

    updateAllButtons();
    const interval = setInterval(updateAllButtons, 3200);
    return () => clearInterval(interval);
  }, []);

  const handleIntroFinish = () => {
    setShowIntro(false);
  };

  return (
    <div className="min-h-screen bg-[#0F0F14] text-[#E5E7EB]">
      <AnimatePresence>
        {showIntro && (
          <IntroOverlay
            onFinish={handleIntroFinish}
          />
        )}
      </AnimatePresence>
      <HashRouter>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/batteries" replace />} />
              <Route path="/batteries" element={<BatteriesView />} />
              <Route path="/matches" element={<MatchesView />} />
              <Route path="/borrowed" element={<BorrowedView />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="/info" element={<InfoView />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

export default App;
