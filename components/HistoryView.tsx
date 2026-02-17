
import React from 'react';
import { InterviewResult, UiLanguage } from '../types';
import { translations } from '../translations';

interface HistoryViewProps {
  history: InterviewResult[];
  uiLang: UiLanguage;
  onSelect: (result: InterviewResult) => void;
  onBack: () => void;
  onClear: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, uiLang, onSelect, onBack, onClear }) => {
  const t = translations[uiLang];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return uiLang === UiLanguage.AR 
        ? date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-5xl mx-auto py-16 px-6 lg:px-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
        <div className="text-start">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Personal Logs</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">{t.history}</h1>
          <p className="text-slate-400 font-bold text-sm mt-3 uppercase tracking-widest">Track your professional growth journey.</p>
        </div>
        <div className="flex gap-4">
            {history.length > 0 && (
                <button 
                    onClick={onClear}
                    className="px-6 py-3 border border-red-100 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                    {uiLang === UiLanguage.AR ? 'تفريغ السجل' : 'PURGE HISTORY'}
                </button>
            )}
            <button 
                onClick={onBack}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:border-slate-400 transition-all"
            >
                {t.goBack}
            </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-[4rem] p-24 text-center premium-shadow border border-slate-200/50 flex flex-col items-center">
          <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-6xl mb-10 animate-float">
             📉
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
            {uiLang === UiLanguage.AR ? 'سجلك فارغ حالياً' : 'No records detected'}
          </h2>
          <p className="text-slate-500 font-medium mb-12 max-w-sm mx-auto leading-relaxed">
            {uiLang === UiLanguage.AR ? 'ابدأ أول مقابلة لك لتتبع تقدمك المهني هنا!' : 'Kickstart your first expert session to begin building your progress analytics.'}
          </p>
          <button 
            onClick={onBack}
            className="btn-premium px-12 py-5 text-white font-black uppercase tracking-[0.2em] rounded-3xl shadow-2xl active:scale-95"
          >
            {t.startNew}
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {history.map((result, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(result)}
              className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all text-start flex flex-col md:flex-row md:items-center justify-between group card-hover"
            >
              <div className="flex items-center gap-8 mb-6 md:mb-0">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-4xl group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 shadow-inner">
                  💻
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                      {result.language} 
                    </h3>
                    <span className="text-[9px] font-black px-3 py-1 bg-indigo-50 text-indigo-500 rounded-full uppercase tracking-widest">{result.difficulty}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formatDate(result.date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-12 self-end md:self-center">
                <div className="text-end md:text-center">
                  <div className={`text-4xl font-black ${
                    result.overallScore >= 80 ? 'text-emerald-500' : result.overallScore >= 60 ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    {result.overallScore}<span className="text-sm opacity-50 ml-0.5">%</span>
                  </div>
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.overallScore}</div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-6 h-6 ${uiLang === UiLanguage.AR ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
