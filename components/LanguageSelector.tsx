
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LANGUAGES } from '../constants';
import { Difficulty, Language, UiLanguage, Question, InterviewResponse } from '../types';
import { translations } from '../translations';
import { geminiService } from '../services/geminiService';

interface SavedSession {
  languageId: string;
  difficulty: Difficulty;
  jobDescription?: string;
  currentIndex: number;
  responses: InterviewResponse[];
  questions: Question[];
}

interface LanguageSelectorProps {
  onSelect: (lang: Language, diff: Difficulty, jd?: string) => void;
  onResume: (session: SavedSession) => void;
  uiLang: UiLanguage;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelect, onResume, uiLang }) => {
  const t = translations[uiLang];
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.JUNIOR);
  const [jobDescription, setJobDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);
  const [analyzingJd, setAnalyzingJd] = useState(false);
  const [extractedLanguages, setExtractedLanguages] = useState<Language[]>([]);
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('interview_in_progress');
    if (saved) {
      try {
        setSavedSession(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved session", e);
      }
    }
  }, []);

  const handleAnalyzeJd = async () => {
    if (!jobDescription.trim()) return;
    setAnalyzingJd(true);
    try {
      const skills = await geminiService.extractSkillsFromJd(jobDescription, uiLang);
      setExtractedLanguages(skills);
      if (skills.length > 0) {
        setSelectedLang(skills[0]);
      }
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setAnalyzingJd(false);
    }
  };

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const allLanguages = useMemo(() => {
    const baseIds = new Set(LANGUAGES.map(l => l.id));
    const uniqueExtracted = extractedLanguages.filter(l => !baseIds.has(l.id));
    return [...uniqueExtracted, ...LANGUAGES];
  }, [extractedLanguages]);

  const filteredLanguages = useMemo(() => {
    return allLanguages.filter(lang => 
      lang.name.en.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lang.name.ar.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allLanguages]);

  const difficulties = [
    { key: Difficulty.JUNIOR, label: t.junior },
    { key: Difficulty.MID, label: t.mid },
    { key: Difficulty.SENIOR, label: t.senior }
  ];

  return (
    <div className="w-full">
      {/* Full-Screen Hero Section */}
      <section className="min-h-[95vh] md:min-h-screen flex flex-col items-center justify-center relative px-4 sm:px-6 overflow-hidden py-16 md:py-24">
        {/* Abstract shapes */}
        <div className="absolute top-1/4 left-1/4 w-[350px] md:w-[650px] h-[350px] md:h-[650px] bg-indigo-500/10 blur-[130px] rounded-full -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[300px] md:w-[550px] h-[300px] md:h-[550px] bg-purple-500/10 blur-[110px] rounded-full -z-10 delay-1000 animate-pulse"></div>
        
        <div className="text-center max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-16 duration-1000 px-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/70 backdrop-blur-md rounded-full border border-slate-200 shadow-sm mb-12">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <span className="text-[10px] md:text-[12px] font-black text-slate-600 uppercase tracking-[0.5em]">
              {uiLang === UiLanguage.AR ? 'الذكاء الاصطناعي الأقوى عالمياً' : 'World Class AI Interviewing'}
            </span>
          </div>

          <h1 className="text-fluid-hero font-black text-slate-900 mb-10 md:mb-14 tracking-tighter">
            {uiLang === UiLanguage.AR ? 'أتقن مهاراتك' : 'Master Your'} <br/>
            <span className="text-gradient font-black">{uiLang === UiLanguage.AR ? 'بذكاء الخبراء' : 'Tech Mastery'}</span>
          </h1>
          
          <p className="text-xl md:text-3xl text-slate-500 font-medium leading-relaxed mb-16 md:mb-24 max-w-4xl mx-auto px-4">
            {t.languageDesc} <br className="hidden md:block"/>
            <span className="opacity-70 text-base md:text-2xl font-semibold leading-relaxed block mt-4">
              {uiLang === UiLanguage.AR ? 'جرب أقوى نظام لمحاكاة المقابلات التقنية في العالم.' : 'Experience the most advanced technical mock-interview system ever built.'}
            </span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-10 px-4">
            <button 
              onClick={scrollToContent}
              className="btn-premium px-12 md:px-24 py-6 md:py-9 text-white font-black text-lg md:text-xl uppercase tracking-[0.3em] rounded-[1.8rem] md:rounded-[3rem] shadow-2xl active:scale-95 transition-all w-full sm:w-auto"
            >
              {uiLang === UiLanguage.AR ? 'ابدأ رحلتك الآن' : 'Start Journey'}
            </button>
            
            {savedSession && (
               <button 
                onClick={() => onResume(savedSession)}
                className="px-10 md:px-16 py-6 md:py-9 bg-white text-slate-900 border border-slate-200 font-black text-lg md:text-xl uppercase tracking-[0.2em] rounded-[1.8rem] md:rounded-[3rem] hover:bg-slate-50 transition-all active:scale-95 shadow-xl w-full sm:w-auto"
              >
                {t.resumeInterview}
              </button>
            )}
          </div>
        </div>

        {/* Floating Social Proof */}
        <div className="mt-20 md:mt-32 flex flex-col items-center gap-6 animate-in fade-in duration-1000 delay-500">
           <div className="flex -space-x-4 md:-space-x-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2.2rem] border-4 md:border-[6px] border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-2xl hover:scale-125 hover:z-20 transition-all cursor-pointer">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=expert${i}`} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
           </div>
           <p className="text-[10px] md:text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] mt-4 text-center px-4 leading-relaxed">
              Trusted by 10,000+ elite software engineers
           </p>
        </div>

        <div 
          onClick={scrollToContent}
          className="hidden md:flex absolute bottom-12 left-1/2 -translate-x-1/2 cursor-pointer flex-col items-center gap-4 animate-bounce opacity-40 hover:opacity-100 transition-all"
        >
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">{uiLang === UiLanguage.AR ? 'استكشف' : 'Explore'}</span>
          <div className="w-7 h-11 border-[3px] border-slate-300 rounded-full flex justify-center p-1.5">
             <div className="w-1.5 h-2.5 bg-slate-400 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div ref={contentRef} className="max-w-7xl mx-auto section-padding px-4 sm:px-6 lg:px-12">
        
        {/* Smart JD Analyzer Card */}
        <div className="mb-24 md:mb-56">
          <div className="bg-white p-1.5 md:p-2.5 rounded-[4rem] md:rounded-[6.5rem] premium-shadow border border-slate-100 shadow-2xl relative">
            <div className="bg-slate-50/50 p-8 md:p-28 rounded-[3.5rem] md:rounded-[6rem] border border-white h-full">
              <div className="flex flex-col lg:flex-row gap-16 lg:gap-28 items-stretch lg:items-start">
                <div className="flex-1 w-full text-start">
                  <div className="flex items-center gap-6 md:gap-8 mb-12 md:mb-16">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-[1.8rem] md:rounded-[2.8rem] flex items-center justify-center text-indigo-600 shadow-2xl shadow-indigo-100 border border-slate-50 text-3xl md:text-5xl">
                      ⚡
                    </div>
                    <div>
                      <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight">{t.jobDescriptionLabel}</h2>
                      <p className="text-slate-400 font-bold text-[11px] md:text-[13px] uppercase tracking-[0.5em] mt-3">Context-Aware Intelligence</p>
                    </div>
                  </div>
                  
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder={t.jobDescriptionPlaceholder}
                    className="w-full h-64 md:h-96 p-8 md:p-16 rounded-[2.5rem] md:rounded-[4.5rem] border-0 focus:ring-[12px] focus:ring-indigo-100/50 resize-none transition-all placeholder-slate-300 bg-white text-lg md:text-3xl font-medium leading-relaxed outline-none shadow-inner"
                  />
                </div>

                <div className="w-full lg:w-[28rem] xl:w-[36rem] flex flex-col gap-12 self-center">
                  <div className="p-10 md:p-20 bg-slate-900 rounded-[3.5rem] md:rounded-[5.5rem] text-white relative overflow-hidden group shadow-[0_60px_120px_-30px_rgba(15,23,42,0.5)]">
                    <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-indigo-500/20 rounded-full blur-[100px] md:blur-[140px]"></div>
                    <div className="relative z-10">
                      <h4 className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.6em] mb-8 md:mb-10 text-indigo-400">Analysis Engine</h4>
                      <p className="text-lg md:text-2xl font-bold leading-relaxed mb-12 md:mb-20 text-slate-300">
                        {uiLang === UiLanguage.AR ? 'دع الذكاء الاصطناعي يقوم بتخصيص المقابلة بناءً على متطلبات الوظيفة بدقة متناهية.' : 'Our AI meticulously scans for microservices, high-load architecture, and specific stack patterns.'}
                      </p>
                      <button
                        onClick={handleAnalyzeJd}
                        disabled={!jobDescription.trim() || analyzingJd}
                        className={`w-full py-7 md:py-10 rounded-[2rem] md:rounded-[3.2rem] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-5 ${
                          analyzingJd 
                          ? 'bg-white/5 text-white/30 cursor-wait' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-2xl shadow-indigo-500/50 active:scale-95'
                        }`}
                      >
                        {analyzingJd ? (
                          <div className="w-8 h-8 border-[5px] border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <span className="text-lg md:text-2xl">{uiLang === UiLanguage.AR ? 'تحليل ذكي' : 'DEEP ANALYZE'}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Skills Gallery */}
        <div className="mb-20 md:mb-32 flex flex-col lg:flex-row justify-between items-stretch lg:items-end gap-14 text-start px-2">
          <div className="max-w-4xl">
            <div className="flex items-center gap-5 mb-8">
               <div className="w-4 h-4 bg-indigo-500 rounded-full animate-ping"></div>
               <span className="text-[11px] md:text-[14px] font-black text-indigo-600 uppercase tracking-[0.7em]">Elite Tech Library</span>
            </div>
            <h2 className="text-4xl md:text-[5.5rem] font-black text-slate-900 tracking-tighter leading-[0.95]">
              {extractedLanguages.length > 0 ? (uiLang === UiLanguage.AR ? 'التقنيات المكتشفة' : 'Custom Tech Stack') : (uiLang === UiLanguage.AR ? 'اختر تخصصك' : 'Choose Your Craft')}
            </h2>
          </div>

          <div className="relative w-full lg:w-[550px] group">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-20 pr-12 py-7 md:py-10 rounded-[2.5rem] md:rounded-[3.5rem] border-0 transition-all bg-white text-xl md:text-2xl font-bold shadow-2xl outline-none ring-1 ring-slate-100 focus:ring-[15px] focus:ring-indigo-100/50"
            />
            <div className={`absolute top-1/2 -translate-y-1/2 ${uiLang === UiLanguage.AR ? 'right-10' : 'left-10'} text-slate-400`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 md:gap-14 mb-48 px-2">
          {filteredLanguages.map((lang) => {
            const isExtracted = extractedLanguages.some(el => el.id === lang.id);
            const isSelected = selectedLang?.id === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang)}
                className={`group p-12 md:p-16 rounded-[4rem] md:rounded-[5.5rem] border-2 transition-all text-start relative overflow-hidden card-hover ${
                  isSelected
                    ? 'border-indigo-600 bg-white ring-[10px] md:ring-[18px] ring-indigo-50 shadow-3xl'
                    : 'border-transparent bg-white shadow-2xl hover:shadow-[0_40px_80px_-20px_rgba(99,102,241,0.2)]'
                }`}
              >
                {isExtracted && (
                  <div className="absolute top-0 right-0 px-8 py-3 bg-indigo-600 text-white text-[10px] md:text-[12px] font-black uppercase tracking-widest rounded-bl-[3rem] z-20 shadow-xl">
                    AI TARGETED
                  </div>
                )}
                
                <div className="text-7xl md:text-9xl mb-12 transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 drop-shadow-2xl">
                  {lang.icon}
                </div>
                
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
                  {lang.name[uiLang]}
                </h3>
                
                <p className="text-base md:text-lg text-slate-400 font-bold leading-relaxed line-clamp-3 mb-8">
                  {lang.description[uiLang]}
                </p>

                <div className={`mt-8 flex items-center gap-4 transition-all duration-700 ${isSelected ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span className="text-[12px] md:text-[14px] font-black text-indigo-600 uppercase tracking-widest">Active Choice</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Persistent Action Bar - Highly optimized for mobile */}
      {selectedLang && (
        <div className="fixed bottom-10 md:bottom-16 left-0 right-0 w-full px-6 md:px-16 z-[160]">
          <div className="max-w-7xl mx-auto glass p-10 md:p-14 rounded-[4rem] md:rounded-[6.5rem] premium-shadow border border-white/90 shadow-[0_70px_140px_-30px_rgba(99,102,241,0.35)] animate-in slide-in-from-bottom-24 duration-700">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
              <div className="flex items-center gap-8 md:gap-14 text-start w-full lg:w-auto">
                <div className="text-6xl md:text-[6rem] animate-float shrink-0 drop-shadow-2xl">{selectedLang.icon}</div>
                <div className="flex flex-col gap-2">
                  <h4 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{selectedLang.name[uiLang]}</h4>
                  <p className="text-[11px] md:text-[13px] font-black text-indigo-500 uppercase tracking-[0.6em] mt-2">Configuring Professional Session</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-10 md:gap-12 w-full lg:w-auto">
                <div className="flex bg-slate-100/70 p-2.5 md:p-3.5 rounded-[2.5rem] md:rounded-[4.5rem] border border-slate-200/60 w-full md:w-auto backdrop-blur-xl">
                  {difficulties.map((diff) => (
                    <button
                      key={diff.key}
                      onClick={() => setDifficulty(diff.key)}
                      className={`flex-1 md:flex-none whitespace-nowrap px-10 md:px-16 py-5 md:py-8 rounded-[1.8rem] md:rounded-[3.5rem] text-[11px] md:text-[14px] font-black uppercase tracking-[0.25em] transition-all ${
                        difficulty === diff.key
                          ? 'bg-white text-indigo-600 shadow-3xl ring-2 ring-slate-100'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => onSelect(selectedLang, difficulty, jobDescription)}
                  className="btn-premium w-full md:w-auto px-16 md:px-32 py-7 md:py-10 text-white font-black text-xl md:text-2xl uppercase tracking-[0.3em] rounded-[2.2rem] md:rounded-[4rem] shadow-[0_30px_60px_-10px_rgba(99,102,241,0.55)] active:scale-95 flex items-center justify-center gap-6 md:gap-10 group"
                >
                  <span className="text-lg md:text-xl font-black">{t.startInterview}</span>
                  <svg className="w-8 h-8 md:w-11 md:h-11 group-hover:translate-x-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
