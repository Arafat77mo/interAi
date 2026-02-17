
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
    <div className={`min-h-screen flex flex-col ${isRtl ? 'font-sans' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="glass fixed top-0 w-full z-[100] border-b border-white/50 h-16 md:h-20 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-full">
          <div className="flex justify-between h-full items-center">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group" onClick={onHomeClick}>
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 group-hover:rotate-12 transition-all duration-500">
                  <span className="text-white font-black text-lg sm:text-xl tracking-tighter">IP</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors leading-none">
                    {t.title}
                  </span>
                  <span className="hidden sm:inline-block text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Powered by AI
                  </span>
                </div>
              </div>

              {/* Visitor Counter Pill */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-full border border-slate-200/60 backdrop-blur-sm shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  {visitorCount.toLocaleString()} {t.visitorCount}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-6">
              <nav className="hidden sm:flex items-center">
                <button 
                  onClick={onHistoryClick}
                  className="text-[11px] font-black text-slate-500 hover:text-indigo-600 transition-colors tracking-[0.15em] uppercase px-4"
                >
                  {t.history}
                </button>
              </nav>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={onToggleLang}
                  className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all text-[11px] font-black shadow-lg shadow-slate-200"
                >
                  <span className="opacity-70 text-base">🌐</span>
                  <span>{uiLang === UiLanguage.EN ? 'AR' : 'EN'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-16 md:pt-20">
        {children}
      </main>

      <footer className="bg-white/40 backdrop-blur-md border-t border-slate-200 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="flex flex-col items-center text-center max-w-lg w-full">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-2xl animate-float">
               🚀
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">{t.title}</h3>
            <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed px-4">
              {t.subtitle}. Designed for the next generation of engineers.
            </p>
            
            <div className="flex flex-col gap-4 w-full mb-12">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] mb-4">Developed by</span>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center px-4">
                <a 
                  href="https://www.linkedin.com/in/mohammed-ahmed-arafat/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 px-5 py-4 bg-white border border-slate-100 rounded-3xl hover:border-indigo-100 transition-all card-hover flex-1"
                >
                  <div className="w-10 h-10 bg-[#0077b5] rounded-xl shrink-0 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </div>
                  <div className="text-start">
                    <span className="block text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Mohammed Arafat
                    </span>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Expert Software Engineer</span>
                  </div>
                </a>

                <a 
                  href="https://ai.mohammed-poop444.workers.dev/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 px-5 py-4 bg-white border border-slate-100 rounded-3xl hover:border-purple-100 transition-all card-hover flex-1"
                >
                  <div className="w-10 h-10 bg-slate-900 rounded-xl shrink-0 flex items-center justify-center text-white shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div className="text-start">
                    <span className="block text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors uppercase tracking-widest">
                      {t.portfolio}
                    </span>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Digital Showcase</span>
                  </div>
                </a>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-200/60 w-full">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] px-4 leading-relaxed">
                &copy; {new Date().getFullYear()} INTERVIEW PRO AI. ALL RIGHTS RESERVED.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
