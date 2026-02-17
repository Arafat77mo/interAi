
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
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">{t.history}</h1>
          <p className="text-gray-500 mt-1">Review your past performance and growth.</p>
        </div>
        <div className="flex gap-3">
            {history.length > 0 && (
                <button 
                    onClick={onClear}
                    className="text-red-500 hover:text-red-700 text-sm font-semibold transition-colors border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50"
                >
                    {uiLang === UiLanguage.AR ? 'مسح السجل' : 'Clear History'}
                </button>
            )}
            <button 
                onClick={onBack}
                className="text-gray-500 hover:text-gray-700 text-sm font-semibold transition-colors"
            >
                {t.goBack}
            </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
          <div className="text-6xl mb-6">📉</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {uiLang === UiLanguage.AR ? 'لا يوجد سجل بعد' : 'No history found yet'}
          </h2>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">
            {uiLang === UiLanguage.AR ? 'ابدأ أول مقابلة لك لتتبع تقدمك هنا!' : 'Start your first interview to track your progress here!'}
          </p>
          <button 
            onClick={onBack}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            {t.startNew}
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((result, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(result)}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-start flex flex-col md:flex-row md:items-center justify-between group"
            >
              <div className="flex items-center gap-5 mb-4 md:mb-0">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {/* Since we only store language string, we could map it back to icons if needed, but simple placeholder for now */}
                  💻
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {result.language} 
                    <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{result.difficulty}</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">{formatDate(result.date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className={`text-2xl font-black ${
                    result.overallScore >= 80 ? 'text-green-600' : result.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {result.overallScore}%
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.overallScore}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 ${uiLang === UiLanguage.AR ? 'rotate-180' : ''}`}>
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
