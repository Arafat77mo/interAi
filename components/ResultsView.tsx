
import React from 'react';
import { InterviewResponse, Language, Difficulty, UiLanguage } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { translations } from '../translations';

interface ResultsViewProps {
  responses: InterviewResponse[];
  language: Language;
  difficulty: Difficulty;
  uiLang: UiLanguage;
  onRestart: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  responses,
  language,
  difficulty,
  uiLang,
  onRestart
}) => {
  const t = translations[uiLang];
  const averageScore = Math.round(
    responses.reduce((acc, r) => acc + r.score, 0) / responses.length
  );

  const chartData = responses.map((r, i) => ({
    name: `Q${i + 1}`,
    score: r.score,
  }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <div className="max-w-5xl mx-auto py-12 md:py-16 px-4 sm:px-6">
      <div className="text-center mb-12 md:mb-16">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{t.summary}</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs md:text-sm">
           {language.name[uiLang]} • {difficulty} Session
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 mb-16 md:mb-24">
        <div className="bg-white p-10 rounded-[2.5rem] premium-shadow border border-slate-100 flex flex-col items-center justify-center text-center">
          <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-4">{t.overallScore}</span>
          <div className={`text-6xl md:text-7xl font-black leading-none mb-2 ${getScoreColor(averageScore)}`}>
            {averageScore}%
          </div>
          <p className="text-slate-500 font-bold text-xs">Technical Proficiency</p>
        </div>

        <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[2.5rem] premium-shadow border border-slate-100 h-64 md:h-auto">
          <ResponsiveContainer width="100%" height="100%" minHeight={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} reversed={uiLang === UiLanguage.AR} tick={{fontSize: 10, fontWeight: 700}} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip 
                cursor={{ fill: '#f8fafc', radius: 8 }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '12px' }}
              />
              <Bar dataKey="score" radius={[8, 8, 8, 8]} barSize={32}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 60 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-8 md:space-y-12 mb-16 md:mb-24 text-start">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-8 px-2 tracking-tight">{t.detailedFeedback}</h2>
        {responses.map((response, idx) => (
          <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl animate-in fade-in duration-700 delay-[100ms]" style={{ animationDelay: `${idx * 150}ms` }}>
            <div className="p-8 md:p-10 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Question {idx + 1}</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-snug tracking-tight">{response.questionText}</h3>
              </div>
              <div className={`shrink-0 px-6 py-3 rounded-2xl text-sm font-black shadow-lg ${getScoreBg(response.score)} ${getScoreColor(response.score)}`}>
                {response.score}/100
              </div>
            </div>
            <div className="p-8 md:p-10 bg-slate-50/40">
              <div className="mb-10">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Professional Response</span>
                <p className="text-slate-700 italic text-lg leading-relaxed font-medium">"{response.userAnswer || 'No answer provided.'}"</p>
              </div>
              
              <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-200/50 shadow-inner">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-4">Expert Critique</span>
                <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-10 font-medium italic">"{response.feedback}"</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                  {response.positives && response.positives.length > 0 && (
                    <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                      <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-4">Strengths Identified</h4>
                      <ul className="space-y-3">
                        {response.positives.map((p, i) => (
                          <li key={i} className="flex gap-3 text-xs md:text-sm text-emerald-900 font-bold leading-relaxed">
                            <span className="shrink-0 text-emerald-500">✅</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {response.improvements && response.improvements.length > 0 && (
                    <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
                      <h4 className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-4">Growth Areas</h4>
                      <ul className="space-y-3">
                        {response.improvements.map((im, i) => (
                          <li key={i} className="flex gap-3 text-xs md:text-sm text-rose-900 font-bold leading-relaxed">
                            <span className="shrink-0 text-rose-400">💡</span>
                            <span>{im}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pb-12">
        <button
          onClick={onRestart}
          className="btn-premium px-12 md:px-16 py-5 md:py-6 text-white font-black text-base md:text-lg uppercase tracking-[0.2em] rounded-2xl shadow-2xl"
        >
          {t.startNew}
        </button>
      </div>
    </div>
  );
};
