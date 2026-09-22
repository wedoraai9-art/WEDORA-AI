import React, { useRef } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/context/AuthContext';
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
import VendorLanding from '@/components/vendor/VendorLanding';
import VendorAuth from '@/components/vendor/VendorAuth';
import VendorDashboard from '@/components/vendor/VendorDashboard';
import AdminDashboard from '@/components/vendor/AdminDashboard';
import Marketplace, { VendorPublicProfile } from '@/components/marketplace/Marketplace';
import SharePage from '@/components/SharePage';
import WeddingPlanner from '@/components/WeddingPlanner';
import WeddingChecklist from '@/components/WeddingChecklist';

const Home = () => {
  const chatPromptRef = useRef(null);

  const handlePrompt = (text) => {
    const el = document.querySelector('#hero');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      if (chatPromptRef.current) chatPromptRef.current(text);
    }, 500);
  };

  return (
    <div className="App min-h-screen">
      <Hero chatRef={chatPromptRef} />
      <Capabilities />
      <HowItWorks />
      <AIDesigner />
      <BudgetPlanner />
      <VenueDiscovery />
      <PromptExamples onPrompt={handlePrompt} />
      <FinalCTA onStart={() => handlePrompt('Help me plan my dream wedding.')} />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App min-h-screen">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/wedding-planning" element={<WeddingPlanner />} />
            <Route path="/wedding-planning/checklist" element={<WeddingChecklist />} />
            <Route path="/for-vendors" element={<VendorLanding />} />
            <Route path="/vendor/auth" element={<VendorAuth />} />
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/vendor/:slug" element={<VendorPublicProfile />} />
            <Route path="/share/:shareId" element={<SharePage />} />
          </Routes>
        </div>
        <Toaster position="top-center" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
