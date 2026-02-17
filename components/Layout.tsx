
import React from 'react';
import { UiLanguage, User } from '../types';
import { translations } from '../translations';

interface LayoutProps {
  children: React.ReactNode;
  uiLang: UiLanguage;
  user: User | null;
  visitorCount?: number;
  onToggleLang: () => void;
  onHistoryClick: () => void;
  onHomeClick: () => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  uiLang, 
  onToggleLang, 
  onHistoryClick, 
  onHomeClick,
  visitorCount = 0
}) => {
  const t = translations[uiLang];
  const isRtl = uiLang === UiLanguage.AR;

  return (
    <div className={`min-h-screen flex flex-col ${isRtl ? 'font-arabic' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="glass fixed top-0 w-full z-[100] border-b border-white/40 h-16 md:h-20 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-full">
          <div className="flex justify-between h-full items-center">
            <div className="flex items-center gap-4 sm:gap-8">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={onHomeClick}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-[0_8px_20px_-5px_rgba(99,102,241,0.4)] group-hover:rotate-6 transition-transform duration-500">
                  <span className="text-white font-black text-xl sm:text-2xl tracking-tighter">IP</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900 group-hover:text-indigo-600 transition-colors leading-none">
                    {t.title}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 opacity-60">
                    Next-Gen AI
                  </span>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 bg-white/50 rounded-full border border-slate-200/50 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                  {visitorCount.toLocaleString()} {t.visitorCount}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-6">
              <nav className="hidden sm:flex items-center gap-8 mr-6">
                <button 
                  onClick={onHistoryClick}
                  className="text-[11px] font-black text-slate-500 hover:text-indigo-600 transition-colors tracking-[0.2em] uppercase"
                >
                  {t.history}
                </button>
              </nav>
              
              <button 
                onClick={onToggleLang}
                className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all text-[11px] font-black shadow-xl shadow-slate-200 uppercase tracking-widest active:scale-95"
              >
                <span className="text-lg">🌐</span>
                <span>{uiLang === UiLanguage.EN ? 'العربية' : 'English'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-16 md:pt-20">
        {children}
      </main>

      <footer className="bg-white/60 backdrop-blur-xl border-t border-slate-200 py-16 md:py-24 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="text-center md:text-start max-w-lg">
              <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mb-8 text-3xl animate-float mx-auto md:mx-0">
                 🤖
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight tracking-tighter">{t.title}</h3>
              <p className="text-lg text-slate-500 font-medium mb-12 leading-relaxed">
                {t.subtitle}. {uiLang === UiLanguage.AR ? 'نظام ذكاء اصطناعي متكامل لبناء مسارك المهني القادم باحترافية.' : 'Advanced AI simulation designed to accelerate your career growth.'}
              </p>
            </div>
            
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-6">
                <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.5em] text-center md:text-start">Developed By Experts</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <a 
                    href="https://www.linkedin.com/in/mohammed-ahmed-arafat/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex items-center gap-5 px-6 py-6 bg-white border border-slate-100 rounded-[2rem] hover:border-indigo-200 transition-all card-hover"
                  >
                    <div className="w-12 h-12 bg-[#0077b5] rounded-2xl shrink-0 flex items-center justify-center text-white shadow-xl shadow-blue-100">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </div>
                    <div className="text-start">
                      <span className="block text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Mohammed Arafat
                      </span>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Lead Software Engineer</span>
                    </div>
                  </a>

                  <a 
                    href="https://ai.mohammed-poop444.workers.dev/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex items-center gap-5 px-6 py-6 bg-white border border-slate-100 rounded-[2rem] hover:border-purple-200 transition-all card-hover"
                  >
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl shrink-0 flex items-center justify-center text-white shadow-xl shadow-slate-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <div className="text-start">
                      <span className="block text-sm font-black text-slate-900 group-hover:text-purple-600 transition-colors uppercase tracking-widest">
                        {t.portfolio}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Digital Showcase</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] text-center md:text-start leading-relaxed">
              &copy; {new Date().getFullYear()} INTERVIEW PRO AI. REDEFINING EXCELLENCE.
            </p>
            <div className="flex gap-8">
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Privacy Policy</span>
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
