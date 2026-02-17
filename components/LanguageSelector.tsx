
import React, { useState, useMemo, useEffect } from 'react';
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
    <div className="max-w-7xl mx-auto py-20 px-6 lg:px-12">
      <div className="text-center mb-20 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tight leading-tight">
          {uiLang === UiLanguage.AR ? 'ارتقِ بمهاراتك' : 'Elevate Your'} <br/>
          <span className="text-gradient">{uiLang === UiLanguage.AR ? 'إلى المستوى التالي' : 'Coding Career'}</span>
        </h1>
        <p className="text-xl text-gray-500 font-medium leading-relaxed mb-10">
          {t.languageDesc}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
           <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="user" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                +1k
              </div>
           </div>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {uiLang === UiLanguage.AR ? 'انضم إلى آلاف المطورين الناجحين' : 'Join thousands of successful developers'}
           </p>
        </div>
      </div>

      {savedSession && !selectedLang && (
        <div className="mb-12 bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 premium-shadow animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-6 text-start">
             <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
               💾
             </div>
             <div>
               <h3 className="text-xl font-black uppercase tracking-tight">{t.resumeInterview}</h3>
               <p className="text-indigo-100 font-medium opacity-80">
                  {uiLang === UiLanguage.AR ? 'لديك جلسة غير مكتملة. هل ترغب في الاستمرار؟' : 'You have an incomplete session. Would you like to continue?'}
               </p>
             </div>
          </div>
          <button 
            onClick={() => onResume(savedSession)}
            className="px-8 py-4 bg-white text-indigo-600 font-black uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition-all shadow-xl active:scale-95"
          >
            {uiLang === UiLanguage.AR ? 'استئناف الآن' : 'Resume Now'}
          </button>
        </div>
      )}

      <div className="mb-24 relative">
        <div className="bg-white p-10 md:p-12 rounded-[3.5rem] premium-shadow border border-gray-100/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-indigo-100/50 transition-colors"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row gap-12 items-start">
              <div className="flex-1 w-full text-start">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t.jobDescriptionLabel}</h2>
                </div>
                
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={t.jobDescriptionPlaceholder}
                  className="w-full h-48 p-8 rounded-[2.5rem] border border-gray-100 focus:border-indigo-600 focus:ring-0 resize-none transition-all placeholder-gray-300 bg-gray-50/30 text-lg font-medium leading-relaxed outline-none"
                />
              </div>

              <div className="w-full lg:w-80 flex flex-col gap-4">
                <button
                  onClick={handleAnalyzeJd}
                  disabled={!jobDescription.trim() || analyzingJd}
                  className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${
                    analyzingJd
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-[#0a0a0b] text-white hover:bg-black active:scale-95 shadow-indigo-500/10'
                  }`}
                >
                  {analyzingJd ? (
                    <>
                      <div className="w-5 h-5 border-3 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      <span>{uiLang === UiLanguage.AR ? 'جاري التحليل...' : 'Analyzing...'}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      <span>{uiLang === UiLanguage.AR ? 'استنباط المهارات' : 'Extract Skills'}</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center px-4 leading-relaxed">
                  {uiLang === UiLanguage.AR ? 'سيقوم الذكاء الاصطناعي باستخراج اللغات والأدوات المطلوبة من النص تلقائياً' : 'AI will automatically detect required languages & tools from your text'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12 flex flex-col md:flex-row justify-between items-center gap-8 text-start">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            {extractedLanguages.length > 0 ? (uiLang === UiLanguage.AR ? 'المهارات المكتشفة والأساسية' : 'Detected & Core Skills') : (uiLang === UiLanguage.AR ? 'اختر لغة المقابلة' : 'Select Interview Language')}
          </h2>
          <p className="text-gray-400 font-medium mt-1">
            {filteredLanguages.length} {uiLang === UiLanguage.AR ? 'تقنية متاحة' : 'technologies available'}
          </p>
        </div>

        <div className="relative w-full md:w-96 group">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-2xl border border-gray-100 focus:border-indigo-600 focus:ring-0 transition-all bg-white text-sm font-bold premium-shadow outline-none"
          />
          <div className={`absolute top-1/2 -translate-y-1/2 ${uiLang === UiLanguage.AR ? 'right-4' : 'left-4'} text-gray-400`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
        {filteredLanguages.map((lang) => {
          const isExtracted = extractedLanguages.some(el => el.id === lang.id);
          return (
            <button
              key={lang.id}
              onClick={() => setSelectedLang(lang)}
              className={`p-10 rounded-[2.5rem] border transition-all text-start relative overflow-hidden group hover:scale-[1.02] ${
                selectedLang?.id === lang.id
                  ? 'border-indigo-600 bg-white ring-8 ring-indigo-50 shadow-2xl'
                  : 'border-white bg-white hover:border-gray-200 premium-shadow'
              }`}
            >
              {isExtracted && (
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl z-20">
                  {uiLang === UiLanguage.AR ? 'مكتشف' : 'AI Detected'}
                </div>
              )}
              <div className="text-5xl mb-8 group-hover:scale-110 transition-transform duration-500">{lang.icon}</div>
              <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">{lang.name[uiLang]}</h3>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">{lang.description[uiLang]}</p>
              
              {selectedLang?.id === lang.id && (
                <div className={`absolute bottom-8 ${uiLang === UiLanguage.AR ? 'left-8' : 'right-8'} text-indigo-600`}>
                  <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedLang && (
        <div className="bg-white/90 backdrop-blur-xl p-12 rounded-[3rem] premium-shadow border border-white sticky bottom-10 animate-in slide-in-from-bottom-10 duration-700 z-50">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="text-start">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] block mb-2">{selectedLang.name[uiLang]} EXPERTISE</span>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t.setupTitle}</h2>
              </div>
              <div className="flex items-center gap-2 bg-gray-50/50 p-2 rounded-2xl border border-gray-100 w-full lg:w-auto overflow-x-auto">
                {difficulties.map((diff) => (
                  <button
                    key={diff.key}
                    onClick={() => setDifficulty(diff.key)}
                    className={`whitespace-nowrap px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      difficulty === diff.key
                        ? 'bg-white text-indigo-600 shadow-md ring-1 ring-gray-100'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => onSelect(selectedLang, difficulty, jobDescription)}
                className="group relative w-full lg:w-auto px-16 py-6 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 shadow-2xl shadow-indigo-200 overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <span>{t.startInterview}</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
