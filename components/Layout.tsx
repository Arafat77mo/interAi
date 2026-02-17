
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
    <div className={`min-h-screen flex flex-col bg-[#fcfcfd] ${isRtl ? 'font-sans' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="glass fixed top-0 w-full z-[100] border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={onHomeClick}>
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform">
                  <span className="text-white font-black text-xl">I</span>
                </div>
                <span className="text-2xl font-extrabold tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {t.title}
                </span>
              </div>

              {/* Visitor Counter Pill */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50/50 rounded-full border border-indigo-100/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  {visitorCount.toLocaleString()} {t.visitorCount}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 md:gap-8">
              <nav className="hidden lg:flex items-center gap-8">
                <button 
                  onClick={onHistoryClick}
                  className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors tracking-wide uppercase"
                >
                  {t.history}
                </button>
              </nav>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={onToggleLang}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 hover:bg-indigo-50 border border-gray-100 transition-all text-sm font-bold text-gray-700"
                >
                  <span>🌐</span>
                  <span>{uiLang === UiLanguage.EN ? 'العربية' : 'English'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-100 py-20 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="flex flex-col items-center text-center max-w-sm">
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">{t.title}</h3>
            <p className="text-sm text-gray-400 font-medium mb-12 leading-relaxed">
              {t.subtitle}
            </p>
            
            <div className="flex flex-col items-center gap-4 mb-12">
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">Curated By</span>
              
              <div className="flex flex-col gap-3 w-full">
                <a 
                  href="https://www.linkedin.com/in/mohammed-ahmed-arafat/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 px-6 py-3 bg-white border border-gray-100 rounded-2xl hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
                >
                  <div className="w-10 h-10 bg-[#0077b5] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </div>
                  <div className="text-start">
                    <span className="block text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      Mohammed Ahmed Arafat
                    </span>
                    <span className="block text-[10px] text-gray-400 font-medium">Senior Software Engineer</span>
                  </div>
                </a>

                {/* Portfolio Link Added Here */}
                <a 
                  href="https://ai.mohammed-poop444.workers.dev/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 px-6 py-3 bg-white border border-gray-100 rounded-2xl hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
                >
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div className="text-start">
                    <span className="block text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">
                      {t.portfolio}
                    </span>
                    <span className="block text-[10px] text-gray-400 font-medium lowercase">ai.mohammed-poop444</span>
                  </div>
                </a>
              </div>
            </div>

            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              &copy; {new Date().getFullYear()} INTERVIEW PRO AI. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
