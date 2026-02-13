
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Moon, 
  Sun, 
  Globe, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Monitor,
  Key,
  ExternalLink,
  Zap
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, language, setLanguage, t } = useSettings();
  const [advancedMode, setAdvancedMode] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const checkAdvanced = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio?.hasSelectedApiKey) {
        const hasKey = await aistudio.hasSelectedApiKey();
        setAdvancedMode(hasKey);
      }
    };
    checkAdvanced();
  }, []);

  const triggerFeedback = () => {
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 2000);
  };

  const handleOpenKeySelection = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio?.openSelectKey) {
      await aistudio.openSelectKey();
      setAdvancedMode(true);
      triggerFeedback();
    }
  };

  const handleDeleteAccount = () => {
    const confirmMsg = language === 'pt-br' ? "TEM CERTEZA?" : language === 'es' ? "¿ESTÁS SEGURO?" : "ARE YOU SURE?";
    if (confirm(confirmMsg)) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-32 animate-fade-in text-cyber-green dark:text-white">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-3xl font-brand font-extrabold text-cyber-green dark:text-white tracking-tight uppercase">{t.settings.title}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t.settings.desc}</p>
        </div>
        
        <AnimatePresence>
          {showFeedback && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 text-cyber-accent text-[10px] font-black uppercase tracking-widest bg-cyber-accent/10 px-4 py-2 rounded-full border border-cyber-accent/20"
            >
              <CheckCircle2 size={12} />
              {t.settings.saved}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* Aparência */}
        <section className="glass border border-cyber-green/5 dark:border-white/10 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4 border-b border-cyber-green/5 dark:border-white/5 pb-4">
            <div className="w-10 h-10 rounded-xl bg-cyber-accent/10 flex items-center justify-center text-cyber-accent">
              <Monitor size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-cyber-green dark:text-white uppercase tracking-tight">{t.settings.appearance}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{t.settings.appearanceDesc}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-cyber-green dark:text-white">{t.settings.viewMode}</p>
            <div className="flex p-1 bg-cyber-green/5 dark:bg-white/5 border border-cyber-green/5 dark:border-white/10 rounded-2xl gap-1">
              <button 
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-white text-cyber-green shadow-lg' : 'text-slate-500 hover:text-cyber-green'}`}
              >
                <Sun size={14} /> {t.settings.light}
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-cyber-green text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                <Moon size={14} /> {t.settings.dark}
              </button>
            </div>
          </div>
        </section>

        {/* Modo Avançado / API Key */}
        <section className="glass border border-cyber-beige/30 rounded-[32px] p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Zap size={120} className="text-cyber-beige" />
          </div>
          
          <div className="flex items-center gap-4 border-b border-white/5 pb-4">
            <div className="w-10 h-10 rounded-xl bg-cyber-beige/10 flex items-center justify-center text-cyber-beige">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-cyber-green dark:text-white uppercase tracking-tight">{t.settings.advanced}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{t.settings.advancedDesc}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-md">
              <p className="text-xs text-slate-500">
                AI Studio / Google Cloud API Key
              </p>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-black text-cyber-beige uppercase flex items-center gap-1 hover:underline"
              >
                Billing Documentation <ExternalLink size={10} />
              </a>
            </div>
            
            <button 
              onClick={handleOpenKeySelection}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                advancedMode 
                ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30 hover:bg-cyber-accent/30' 
                : 'bg-cyber-beige text-cyber-dark shadow-lg shadow-cyber-beige/20'
              }`}
            >
              <Key size={14} />
              {advancedMode ? 'Alterar API Key' : 'Configurar API'}
            </button>
          </div>
        </section>

        {/* Idioma */}
        <section className="glass border border-cyber-green/5 dark:border-white/10 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4 border-b border-cyber-green/5 dark:border-white/5 pb-4">
            <div className="w-10 h-10 rounded-xl bg-cyber-accent/10 flex items-center justify-center text-cyber-accent">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-cyber-green dark:text-white uppercase tracking-tight">{t.settings.language}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Localization</p>
            </div>
          </div>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => { setLanguage('pt-br'); triggerFeedback(); }}
              className={`px-6 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                language === 'pt-br' ? 'bg-cyber-accent/10 text-cyber-accent border-cyber-accent' : 'text-slate-500 border-cyber-green/5 dark:border-white/5'
              }`}
            >
              Português 🇧🇷
            </button>
            <button
              onClick={() => { setLanguage('en'); triggerFeedback(); }}
              className={`px-6 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                language === 'en' ? 'bg-cyber-accent/10 text-cyber-accent border-cyber-accent' : 'text-slate-500 border-cyber-green/5 dark:border-white/5'
              }`}
            >
              English 🇺🇸
            </button>
            <button
              onClick={() => { setLanguage('es'); triggerFeedback(); }}
              className={`px-6 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                language === 'es' ? 'bg-cyber-accent/10 text-cyber-accent border-cyber-accent' : 'text-slate-500 border-cyber-green/5 dark:border-white/5'
              }`}
            >
              Español 🇪🇸
            </button>
          </div>
        </section>

        {/* Zona de Perigo */}
        <section className="p-8 rounded-[32px] bg-red-500/5 border border-red-500/20 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-cyber-green dark:text-white uppercase tracking-tight">{t.settings.danger}</h3>
              <p className="text-[10px] text-red-400 uppercase tracking-widest font-black">Irreversible actions</p>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 max-w-md">LocalStorage Wipe</p>
            <button 
              onClick={handleDeleteAccount}
              className="px-6 py-3 border border-red-500/30 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
            >
              <Trash2 size={14} className="inline mr-2" /> {t.settings.deleteBtn}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
