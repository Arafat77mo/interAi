
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LanguageSelector } from './components/LanguageSelector';
import { InterviewSession } from './components/InterviewSession';
import { ResultsView } from './components/ResultsView';
import { HistoryView } from './components/HistoryView';
import { Language, Difficulty, InterviewResponse, UiLanguage, InterviewResult, Question, User } from './types';
import { LANGUAGES } from './constants';
import { translations } from './translations';

enum ViewState {
  SETUP,
  INTERVIEW,
  RESULTS,
  HISTORY
}

interface SavedSession {
  languageId: string;
  difficulty: Difficulty;
  jobDescription?: string;
  currentIndex: number;
  responses: InterviewResponse[];
  questions: Question[];
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.SETUP);
  const [uiLang, setUiLang] = useState<UiLanguage>(UiLanguage.AR);
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.JUNIOR);
  const [jobDescription, setJobDescription] = useState<string | undefined>(undefined);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [history, setHistory] = useState<InterviewResult[]>([]);
  const [viewingResult, setViewingResult] = useState<InterviewResult | null>(null);
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [resumedState, setResumedState] = useState<{
    responses: InterviewResponse[];
    currentIndex: number;
    questions: Question[];
  } | undefined>(undefined);

  // Visitor Tracking & Key Check
  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();

    const savedHistory = localStorage.getItem('interview_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }

    const baseVisitors = 1420;
    const localVisits = parseInt(localStorage.getItem('visit_count') || '0');
    const isNewSession = !sessionStorage.getItem('session_active');
    
    let currentVisits = localVisits;
    if (isNewSession) {
      currentVisits = localVisits + 1;
      localStorage.setItem('visit_count', currentVisits.toString());
      sessionStorage.setItem('session_active', 'true');
    }
    setVisitorCount(baseVisitors + currentVisits);
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true); // Assume success per race condition guidelines
    }
  };

  const handleStart = (lang: Language, diff: Difficulty, jd?: string) => {
    setSelectedLang(lang);
    setDifficulty(diff);
    setJobDescription(jd);
    setResumedState(undefined);
    setView(ViewState.INTERVIEW);
  };

  const handleResume = (session: SavedSession) => {
    const lang = LANGUAGES.find(l => l.id === session.languageId) || LANGUAGES[0];
    setSelectedLang(lang);
    setDifficulty(session.difficulty);
    setJobDescription(session.jobDescription);
    setResumedState({
      responses: session.responses,
      currentIndex: session.currentIndex,
      questions: session.questions
    });
    setView(ViewState.INTERVIEW);
  };

  const handleComplete = (finalResponses: InterviewResponse[]) => {
    setResponses(finalResponses);
    const avgScore = Math.round(
      finalResponses.reduce((acc, r) => acc + r.score, 0) / finalResponses.length
    );
    const newResult: InterviewResult = {
      date: new Date().toISOString(),
      language: selectedLang?.name.en || 'Unknown',
      difficulty: difficulty,
      responses: finalResponses,
      overallScore: avgScore,
      jobDescription: jobDescription
    };
    const updatedHistory = [newResult, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('interview_history', JSON.stringify(updatedHistory));
    setView(ViewState.RESULTS);
  };

  const handleRestart = () => {
    setView(ViewState.SETUP);
    setSelectedLang(null);
    setViewingResult(null);
    setResponses([]);
    setResumedState(undefined);
  };

  const handleViewHistory = () => {
    setView(ViewState.HISTORY);
  };

  const handleSelectHistoryItem = (result: InterviewResult) => {
    setViewingResult(result);
    setView(ViewState.RESULTS);
  };

  const toggleUiLang = () => {
    setUiLang(prev => prev === UiLanguage.EN ? UiLanguage.AR : UiLanguage.EN);
  };

  const renderView = () => {
    switch (view) {
      case ViewState.SETUP:
        return <LanguageSelector onSelect={handleStart} onResume={handleResume} uiLang={uiLang} onSelectKey={handleSelectKey} hasKey={hasKey} />;
      case ViewState.INTERVIEW:
        if (!selectedLang) return null;
        return (
          <InterviewSession
            language={selectedLang}
            difficulty={difficulty}
            uiLang={uiLang}
            jobDescription={jobDescription}
            onComplete={handleComplete}
            onCancel={handleRestart}
            initialState={resumedState}
          />
        );
      case ViewState.RESULTS:
        const activeResult = viewingResult || {
          language: selectedLang?.name.en || '',
          difficulty: difficulty,
          responses: responses
        };
        const langObj = selectedLang || { name: { en: activeResult.language, ar: activeResult.language }, icon: '💻' } as Language;
        return (
          <ResultsView
            responses={activeResult.responses}
            language={langObj}
            difficulty={activeResult.difficulty as Difficulty}
            uiLang={uiLang}
            onRestart={handleRestart}
          />
        );
      case ViewState.HISTORY:
        return (
          <HistoryView 
            history={history} 
            uiLang={uiLang} 
            onSelect={handleSelectHistoryItem} 
            onBack={handleRestart}
            onClear={() => {
                setHistory([]);
                localStorage.removeItem('interview_history');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout 
      uiLang={uiLang} 
      user={null}
      visitorCount={visitorCount}
      hasKey={hasKey}
      onToggleLang={toggleUiLang} 
      onHistoryClick={handleViewHistory} 
      onHomeClick={handleRestart}
      onLogout={() => {}}
      onSelectKey={handleSelectKey}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
