import React, { useRef } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Capabilities from '@/components/Capabilities';
import HowItWorks from '@/components/HowItWorks';
import AIDesigner from '@/components/AIDesigner';
import BudgetPlanner from '@/components/BudgetPlanner';
import VenueDiscovery from '@/components/VenueDiscovery';
import PromptExamples from '@/components/PromptExamples';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';

const Home = () => {
  // ref used by children (PromptExamples, FinalCTA) to populate hero chat input
  const chatPromptRef = useRef(null);

  const handlePrompt = (text) => {
    // Scroll to hero and populate
    const el = document.querySelector('#hero');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      if (chatPromptRef.current) chatPromptRef.current(text);
    }, 500);
  };

  return (
    <div className="App min-h-screen">
      <Navigation />
      <Hero chatRef={chatPromptRef} />
      <Capabilities />
      <HowItWorks />
      <AIDesigner />
      <BudgetPlanner />
      <VenueDiscovery />
      <PromptExamples onPrompt={handlePrompt} />
      <FinalCTA onStart={() => handlePrompt('Help me plan my dream wedding.')} />
      <Footer />
      <Toaster position="top-center" />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
