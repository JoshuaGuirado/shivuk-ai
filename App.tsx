
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainChat } from './components/MainChat';
import { LoginPage } from './components/LoginPage';
import { BrandsPage } from './components/BrandsPage';
import { LibraryPage } from './components/LibraryPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { TemplatesPage } from './components/TemplatesPage';
import { AboutPage } from './components/AboutPage';
import { ProfilePage } from './components/ProfilePage';
import { SettingsPage } from './components/SettingsPage';
import { PlansPage } from './components/PlansPage'; // Novo Import
import { View } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { BrandProvider } from './contexts/BrandContext';
import { LibraryProvider } from './contexts/LibraryContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { GenerationProvider } from './contexts/GenerationContext';
import { Menu } from 'lucide-react';

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('shivuk_logged_in') === 'true';
  });
  const [currentView, setCurrentView] = useState<View>(View.CHAT);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t } = useSettings();

  const handleLogin = () => {
    localStorage.setItem('shivuk_logged_in', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('shivuk_logged_in');
    setIsAuthenticated(false);
  };

  const handleSelectTemplate = (prompt: string) => {
    setPendingPrompt(prompt);
    setCurrentView(View.CHAT);
  };

  const renderContent = () => {
    switch (currentView) {
      case View.CHAT:
        return (
          <MainChat 
            initialPrompt={pendingPrompt} 
            onClearInitialPrompt={() => setPendingPrompt(null)} 
          />
        );
      case View.TEMPLATES:
        return <TemplatesPage onSelectTemplate={handleSelectTemplate} />;
      case View.BRANDS:
        return <BrandsPage />;
      case View.LIBRARY:
        return <LibraryPage />;
      case View.ANALYTICS:
        return <AnalyticsPage />;
      case View.PLANS:
        return <PlansPage />;
      case View.ABOUT:
        return <AboutPage />;
      case View.SETTINGS:
        return <SettingsPage />;
      case View.PROFILE:
        return <ProfilePage />;
      default:
        return <MainChat />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const getTitle = (view: View) => {
    if (!t || !t.header) return 'Shivuk AI';
    switch (view) {
      case View.CHAT: return t.header.studio;
      case View.TEMPLATES: return t.header.ideas;
      case View.BRANDS: return t.header.brands;
      case View.LIBRARY: return t.header.library;
      case View.ANALYTICS: return t.header.analytics;
      case View.PLANS: return t.sidebar.manage;
      case View.ABOUT: return t.header.about;
      case View.SETTINGS: return t.header.settings;
      case View.PROFILE: return t.header.profile;
      default: return 'Shivuk AI';
    }
  };

  return (
    // MAIN CONTAINER: 
    // Light Mode: bg-cyber-light (White), text-cyber-green (Dark Green)
    // Dark Mode: bg-cyber-dark (Deep Green), text-white (Pure White)
    <div className="flex h-screen w-full bg-cyber-light dark:bg-cyber-dark text-cyber-green dark:text-white overflow-hidden font-sans transition-colors duration-300">
      <Sidebar 
        activeView={currentView} 
        onViewChange={setCurrentView} 
        onLogout={handleLogout} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* Header Glass: Consistent Borders */}
        <header className="h-16 glass border-b border-cyber-green/10 dark:border-cyber-beige/20 flex items-center justify-between px-6 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-cyber-electric"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-display font-bold text-cyber-green dark:text-white uppercase tracking-wider">
              {getTitle(currentView)}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-cyber-green dark:text-white leading-none">{t.header?.role || 'Diretor Criativo'}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{t.header?.account || 'Conta Pro'}</p>
            </div>
            <div 
              onClick={() => setCurrentView(View.PROFILE)}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyber-green to-cyber-dark flex items-center justify-center text-xs font-bold border border-cyber-beige/30 cursor-pointer hover:ring-2 ring-cyber-beige transition-all shadow-lg shadow-cyber-green/10 overflow-hidden text-white"
            >
               <ProfileSmallAvatar />
            </div>
          </div>
        </header>

        {/* Content Area Background Gradient */}
        <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyber-green/5 via-transparent to-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const ProfileSmallAvatar: React.FC = () => {
  const [avatar, setAvatar] = useState<string | null>(null);

  const loadAvatar = () => {
    const individual = localStorage.getItem('shivuk_user_avatar');
    if (individual) {
      setAvatar(individual);
      return;
    }
    const saved = localStorage.getItem('shivuk_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAvatar(parsed.avatar);
      } catch (e) {}
    }
  };

  useEffect(() => {
    loadAvatar();
    window.addEventListener('user-updated', loadAvatar);
    return () => window.removeEventListener('user-updated', loadAvatar);
  }, []);

  if (avatar) return <img src={avatar} className="w-full h-full object-cover" />;
  return <span className="text-white">JD</span>;
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <BrandProvider>
        <LibraryProvider>
          <GenerationProvider>
            <AppContent />
          </GenerationProvider>
        </LibraryProvider>
      </BrandProvider>
    </SettingsProvider>
  );
};

export default App;
