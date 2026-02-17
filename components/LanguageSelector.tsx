
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
      {/* Hero Section - Balanced Sizing */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center relative px-4 sm:px-6 overflow-hidden py-12 md:py-20">
        <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-500/5 blur-[100px] rounded-full -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-purple-500/5 blur-[80px] rounded-full -z-10"></div>
        
        <div className="text-center max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 px-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full border border-slate-200 shadow-sm mb-8">
            <span className="relative flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
            <span className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">
              {uiLang === UiLanguage.AR ? 'منصة المقابلات الذكية' : 'Smart AI Interview Platform'}
            </span>
          </div>

          <h1 className="text-fluid-hero text-slate-900 mb-6 tracking-tight">
            {uiLang === UiLanguage.AR ? 'أتقن مهاراتك' : 'Master Your'} <br/>
            <span className="text-gradient">{uiLang === UiLanguage.AR ? 'بذكاء الخبراء' : 'Tech Career'}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-10 max-w-2xl mx-auto">
            {t.languageDesc}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
            <button 
              onClick={scrollToContent}
              className="btn-premium px-10 py-4 text-white font-bold text-base uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all w-full sm:w-auto"
            >
              {uiLang === UiLanguage.AR ? 'ابدأ الآن' : 'Get Started'}
            </button>
            
            {savedSession && (
               <button 
                onClick={() => onResume(savedSession)}
                className="px-8 py-4 bg-white text-slate-900 border border-slate-200 font-bold text-base uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-all active:scale-95 w-full sm:w-auto"
              >
                {t.resumeInterview}
              </button>
            )}
          </div>
        </div>

        {/* Social Proof - Scaled Down */}
        <div className="mt-16 flex flex-col items-center gap-4 opacity-80 scale-90">
           <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=expert${i}`} alt="user" className="w-full h-full object-cover" />
                </div>
              ))}
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Trusted by 10k+ elite engineers
           </p>
        </div>
      </section>

      {/* Main Content - Improved Max Width and Spacing */}
      <div ref={contentRef} className="max-w-6xl mx-auto py-12 md:py-24 px-4 sm:px-6 lg:px-8">
        
        {/* Job Description Analyzer - Optimized Spacing */}
        <div className="mb-20 md:mb-32">
          <div className="bg-white rounded-3xl premium-shadow border border-slate-100 overflow-hidden">
            <div className="bg-slate-50/30 p-6 md:p-12">
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1 w-full text-start">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-xl">
                      🎯
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{t.jobDescriptionLabel}</h2>
                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mt-1">Contextual Analysis</p>
                    </div>
                  </div>
                  
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder={t.jobDescriptionPlaceholder}
                    className="w-full h-48 md:h-64 p-6 rounded-2xl border-0 focus:ring-4 focus:ring-indigo-100/50 resize-none transition-all placeholder-slate-300 bg-white text-base md:text-lg font-medium leading-relaxed outline-none shadow-inner"
                  />
                </div>

                <div className="w-full lg:w-80 flex flex-col justify-center">
                  <div className="p-8 bg-slate-900 rounded-3xl text-white relative overflow-hidden shadow-xl">
                    <div className="relative z-10">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-indigo-400">Smart Engine</h4>
                      <p className="text-sm md:text-base font-medium leading-relaxed mb-8 text-slate-300">
                        {uiLang === UiLanguage.AR ? 'تقنية فريدة لتحليل متطلبات الوظيفة وبناء أسئلة تحاكي الواقع المهني.' : 'Leverage deep context to simulate the exact requirements of your target role.'}
                      </p>
                      <button
                        onClick={handleAnalyzeJd}
                        disabled={!jobDescription.trim() || analyzingJd}
                        className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-3 ${
                          analyzingJd 
                          ? 'bg-white/5 text-white/30 cursor-wait' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg active:scale-95'
                        }`}
                      >
                        {analyzingJd ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <span>{uiLang === UiLanguage.AR ? 'تحليل ذكي' : 'Smart Analyze'}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Gallery Header - Reduced Sizes */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-stretch md:items-end gap-8 text-start px-2">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
               <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Tech Specializations</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {extractedLanguages.length > 0 ? (uiLang === UiLanguage.AR ? 'التقنيات المستكشفة' : 'Detected Stack') : (uiLang === UiLanguage.AR ? 'اختر تخصصك' : 'Choose Your Craft')}
            </h2>
          </div>

          <div className="relative w-full md:w-80 group">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 rounded-xl border border-slate-200 transition-all bg-white text-sm font-semibold shadow-sm focus:ring-4 focus:ring-indigo-100/50 outline-none"
            />
            <div className={`absolute top-1/2 -translate-y-1/2 ${uiLang === UiLanguage.AR ? 'right-4' : 'left-4'} text-slate-400`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Cards Grid - Truly Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-32 px-2">
          {filteredLanguages.map((lang) => {
            const isExtracted = extractedLanguages.some(el => el.id === lang.id);
            const isSelected = selectedLang?.id === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang)}
                className={`group p-8 rounded-3xl border-2 transition-all text-start relative overflow-hidden card-hover ${
                  isSelected
                    ? 'border-indigo-600 bg-white ring-4 ring-indigo-50 shadow-xl'
                    : 'border-transparent bg-white shadow-sm hover:shadow-md'
                }`}
              >
                {isExtracted && (
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-bl-2xl z-20">
                    AI TARGETED
                  </div>
                )}
                
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">
                  {lang.icon}
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                  {lang.name[uiLang]}
                </h3>
                
                <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-3 mb-4">
                  {lang.description[uiLang]}
                </p>

                <div className={`mt-4 flex items-center gap-2 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Selected</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Action Bar - Ergonomic Sizing */}
      {selectedLang && (
        <div className="fixed bottom-6 left-0 right-0 w-full px-4 md:px-8 z-[170]">
          <div className="max-w-5xl mx-auto glass p-6 md:p-8 rounded-2xl md:rounded-[3rem] premium-shadow border border-white/60 shadow-2xl animate-in slide-in-from-bottom-12 duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-start w-full md:w-auto">
                <div className="text-4xl md:text-5xl shrink-0">{selectedLang.icon}</div>
                <div className="flex flex-col">
                  <h4 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none">{selectedLang.name[uiLang]}</h4>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-2">Ready to Start</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/50 w-full sm:w-auto">
                  {difficulties.map((diff) => (
                    <button
                      key={diff.key}
                      onClick={() => setDifficulty(diff.key)}
                      className={`flex-1 sm:flex-none whitespace-nowrap px-6 py-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                        difficulty === diff.key
                          ? 'bg-white text-indigo-600 shadow-md'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => onSelect(selectedLang, difficulty, jobDescription)}
                  className="btn-premium w-full sm:w-auto px-12 py-4 text-white font-bold text-base uppercase tracking-wider rounded-xl shadow-lg active:scale-95 flex items-center justify-center gap-4 group"
                >
                  <span>{t.startInterview}</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
