
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
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{t.summary}</h1>
        <p className="text-gray-500">{language.name[uiLang]} • {difficulty} Session</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-gray-500 font-medium mb-1">{t.overallScore}</span>
          <div className={`text-6xl font-black ${getScoreColor(averageScore)}`}>
            {averageScore}%
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-md border border-gray-100 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} reversed={uiLang === UiLanguage.AR} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 60 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-6 mb-12 text-start">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.detailedFeedback}</h2>
        {responses.map((response, idx) => (
          <div key={idx} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-50 flex justify-between items-start gap-4">
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1 block">Question {idx + 1}</span>
                <h3 className="text-lg font-bold text-gray-900 leading-snug">{response.questionText}</h3>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${getScoreBg(response.score)} ${getScoreColor(response.score)}`}>
                {response.score}/100
              </div>
            </div>
            <div className="p-6 bg-gray-50/50">
              <div className="mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">{t.yourAnswer}</span>
                <p className="text-gray-700 italic">"{response.userAnswer}"</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100">
                <span className="text-xs font-bold text-indigo-600 uppercase block mb-1">{t.aiCritique}</span>
                <p className="text-gray-600 text-sm leading-relaxed">{response.feedback}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onRestart}
          className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all hover:-translate-y-1"
        >
          {t.startNew}
        </button>
      </div>
    </div>
  );
};
