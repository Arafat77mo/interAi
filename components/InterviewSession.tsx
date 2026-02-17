
import React, { useState, useEffect, useRef } from 'react';
import { Difficulty, Language, Question, InterviewResponse, UiLanguage } from '../types';
import { geminiService, DetailedEvaluation } from '../services/geminiService';
import { translations } from '../translations';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

interface InterviewSessionProps {
  language: Language;
  difficulty: Difficulty;
  uiLang: UiLanguage;
  jobDescription?: string;
  onComplete: (responses: InterviewResponse[]) => void;
  onCancel: () => void;
  initialState?: {
    responses: InterviewResponse[];
    currentIndex: number;
    questions: Question[];
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const InterviewSession: React.FC<InterviewSessionProps> = ({
  language,
  difficulty,
  uiLang,
  jobDescription,
  onComplete,
  onCancel,
  initialState
}) => {
  const t = translations[uiLang];
  const [questions, setQuestions] = useState<Question[]>(initialState?.questions || []);
  const [currentIndex, setCurrentIndex] = useState(initialState?.currentIndex || 0);
  const [userAnswer, setUserAnswer] = useState('');
  const [responses, setResponses] = useState<InterviewResponse[]>(initialState?.responses || []);
  const [loading, setLoading] = useState(!initialState);
  const [evaluating, setEvaluating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<DetailedEvaluation | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const playQuestionText = async (text: string) => {
    if (!voiceEnabled) return;
    try {
      setIsSpeaking(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = uiLang === UiLanguage.AR 
        ? `اقرأ هذا السؤال للمرشح بوضوح: ${text}` 
        : `Read this interview question clearly to the candidate: ${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: uiLang === UiLanguage.AR ? 'Puck' : 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current);
        if (currentSourceRef.current) currentSourceRef.current.stop();
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsSpeaking(false);
        currentSourceRef.current = source;
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      console.error("TTS Error:", e);
      setIsSpeaking(false);
    }
  };

  const startLiveSTT = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      setIsListening(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const base64Data = encode(new Uint8Array(int16.buffer));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ 
                  media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' } 
                });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setInterimTranscript(prev => prev + text);
            }
            if (message.serverContent?.turnComplete) {
              setInterimTranscript(current => {
                if (current) {
                  setUserAnswer(prev => prev + (prev ? ' ' : '') + current);
                }
                return '';
              });
            }
          },
          onerror: (e) => {
            console.error("Live STT Error:", e);
            setIsListening(false);
          },
          onclose: () => setIsListening(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: "You are an expert technical interviewer's transcription assistant. The user is a developer answering a technical question. They will likely speak in a mix of Arabic and English (code terms, frameworks). Your ONLY job is to transcribe their speech accurately and automatically detect which language they are using for each word. Transcribe technical terms correctly (e.g., 'Middleware', 'Laravel', 'Async'). Do not provide your own answers or chatter. Just output the transcription."
        }
      });

      liveSessionRef.current = await sessionPromise;
    } catch (e) {
      console.error("Failed to start Live STT", e);
      setIsListening(false);
    }
  };

  const stopLiveSTT = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const toggleListening = () => {
    if (isListening) stopLiveSTT();
    else startLiveSTT();
  };

  useEffect(() => {
    const init = async () => {
      if (initialState) return;
      setLoading(true);
      const q = await geminiService.generateQuestions(language.name.en, difficulty, uiLang, 5, jobDescription);
      setQuestions(q);
      setLoading(false);
      if (q.length > 0) setTimeout(() => playQuestionText(q[0].text), 1000);
    };
    init();

    return () => {
      stopLiveSTT();
      if (currentSourceRef.current) currentSourceRef.current.stop();
    };
  }, [uiLang, language.name.en, difficulty, jobDescription]);

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;
    stopLiveSTT();
    if (currentSourceRef.current) currentSourceRef.current.stop();
    
    setEvaluating(true);
    const evaluation = await geminiService.evaluateAnswer(
      questions[currentIndex].text,
      userAnswer,
      language.name.en,
      difficulty,
      uiLang,
      jobDescription
    );
    
    setCurrentEvaluation(evaluation);
    setEvaluating(false);
    setShowFeedback(true);
  };

  const handleProceed = () => {
    if (!currentEvaluation) return;

    const newResponse: InterviewResponse = {
      questionId: questions[currentIndex].id,
      questionText: questions[currentIndex].text,
      userAnswer: userAnswer,
      feedback: currentEvaluation.feedback,
      positives: currentEvaluation.positives,
      improvements: currentEvaluation.improvements,
      score: currentEvaluation.score
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);
    setUserAnswer('');
    setShowFeedback(false);
    setCurrentEvaluation(null);

    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      playQuestionText(questions[nextIdx].text);
    } else {
      localStorage.removeItem('interview_in_progress');
      onComplete(updatedResponses);
    }
  };

  const handleSaveProgress = () => {
    const sessionData = {
      languageId: language.id,
      difficulty,
      jobDescription,
      currentIndex,
      responses,
      questions,
      timestamp: new Date().getTime()
    };
    localStorage.setItem('interview_in_progress', JSON.stringify(sessionData));
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 md:py-64 text-center px-6">
        <div className="relative w-32 h-32 md:w-48 md:h-48 mb-14 md:mb-20">
          <div className="absolute inset-0 border-[8px] md:border-[10px] border-indigo-100/50 rounded-[3rem] md:rounded-[4rem] rotate-45"></div>
          <div className="absolute inset-0 border-[8px] md:border-[10px] border-indigo-600 rounded-[3rem] md:rounded-[4rem] border-t-transparent animate-spin rotate-45"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl md:text-6xl font-black text-indigo-600">AI</span>
          </div>
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-8 leading-none">{t.preparing}</h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-xs md:text-base">
           Personalizing Technical Context
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-7xl mx-auto py-12 md:py-24 px-4 sm:px-6 lg:px-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      
      {/* Loading Evaluation Overlay */}
      {evaluating && (
        <div className="fixed inset-0 z-[200] bg-slate-900/98 backdrop-blur-[50px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-600">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-indigo-500 rounded-[3rem] animate-bounce mb-14 shadow-[0_50px_100px_-20px_rgba(99,102,241,0.7)] flex items-center justify-center">
             <div className="w-10 h-10 md:w-14 md:h-14 border-[6px] md:border-[8px] border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8">
             {t.analyzing}
          </h2>
          <p className="text-indigo-400 font-bold uppercase tracking-[0.6em] text-sm md:text-lg">{t.reviewingFeedback}</p>
        </div>
      )}

      {/* Progress Header - Spaced and Polished */}
      <div className="mb-20 md:mb-32 flex flex-col md:flex-row md:items-center justify-between gap-14">
        <div className="text-start flex-1 max-w-3xl">
          <div className="flex items-center gap-6 md:gap-10 mb-8 md:mb-10">
             <div className="w-20 h-20 md:w-28 md:h-28 bg-indigo-600 rounded-[2rem] md:rounded-[3.5rem] flex items-center justify-center text-5xl md:text-7xl shadow-3xl shadow-indigo-100 animate-float shrink-0">
               {language.icon}
             </div>
             <div>
               <h4 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{language.name[uiLang]}</h4>
               <p className="text-[12px] md:text-[14px] font-black text-slate-400 uppercase tracking-[0.5em] mt-4">Professional Level: {difficulty}</p>
             </div>
          </div>
          <div className="flex items-center gap-8 md:gap-12">
            <div className="relative h-5 md:h-7 flex-1 md:flex-none md:w-[500px] bg-slate-200/40 rounded-full overflow-hidden border border-slate-100/50">
               <div className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 transition-all duration-1000 ease-out shadow-[0_8px_20px_-5px_rgba(99,102,241,0.6)]" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-[13px] md:text-[16px] font-black text-indigo-600 uppercase tracking-[0.4em] shrink-0 font-mono">
               {currentIndex + 1} <span className="text-slate-300 mx-1">/</span> {questions.length}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button onClick={handleSaveProgress} className="w-16 h-16 md:w-20 md:h-20 rounded-[1.8rem] md:rounded-[2.5rem] bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-md active:scale-95">
            <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
          </button>
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.8rem] md:rounded-[2.5rem] border transition-all flex items-center justify-center active:scale-95 shadow-md ${voiceEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-xl shadow-indigo-500/10' : 'bg-white border-slate-200 text-slate-300'}`}>
            {voiceEnabled ? (
              <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
            ) : (
              <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
            )}
          </button>
          <button onClick={onCancel} className="px-8 md:px-14 py-5 md:py-7 rounded-[1.8rem] md:rounded-[2.5rem] bg-white border border-slate-200 text-[11px] md:text-[13px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-red-500 hover:border-red-200 transition-all shadow-md active:scale-95">
            {t.quit}
          </button>
        </div>
      </div>

      {/* Main Question Card - Immersive and High Contrast */}
      <div className="bg-white rounded-[3rem] md:rounded-[6rem] p-12 md:p-40 premium-shadow border border-slate-100 mb-24 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-16 md:p-32 opacity-[0.04] select-none scale-150 rotate-12 pointer-events-none">
           <span className="text-[12rem] md:text-[20rem] font-black italic tracking-tighter">PHASE</span>
        </div>
        
        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <div className="flex justify-center mb-10 md:mb-16">
            <span className="px-8 md:px-10 py-4 bg-slate-900 text-white text-[11px] md:text-[14px] font-black uppercase tracking-[0.6em] rounded-full shadow-[0_25px_50px_-10px_rgba(15,23,42,0.4)]">
              {currentQuestion.category}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-7xl lg:text-[5.5rem] font-black text-slate-900 leading-[1.15] md:leading-[1.1] mb-20 md:mb-40 tracking-tighter text-fluid-hero">
            {currentQuestion.text}
          </h1>

          <div className="relative">
            {/* Live Speech Console - More Prominent */}
            {(isListening || interimTranscript) && (
              <div className="absolute -top-20 md:-top-28 left-1/2 -translate-x-1/2 w-full px-6 z-40 flex justify-center">
                <div className="bg-white border-2 border-indigo-100 rounded-[2rem] md:rounded-full px-10 md:px-16 py-6 md:py-9 shadow-[0_40px_80px_-20px_rgba(99,102,241,0.4)] flex items-center gap-6 md:gap-10 animate-in slide-in-from-bottom-8 duration-500 w-full max-w-4xl border-b-8 border-b-indigo-500">
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="w-3 h-3 md:w-5 md:h-5 bg-indigo-500 rounded-full animate-ping"></span>
                    <span className="text-[12px] md:text-[15px] font-black text-indigo-600 uppercase tracking-[0.5em]">{uiLang === UiLanguage.AR ? 'جاري التحليل' : 'CAPTURING LIVE'}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200 shrink-0"></div>
                  <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-lg md:text-3xl font-bold text-slate-900 lowercase italic text-start leading-none pb-2">
                    {interimTranscript || (uiLang === UiLanguage.AR ? 'أخبرنا عن خبراتك...' : 'Tell us about your expertise...')}
                  </div>
                </div>
              </div>
            )}

            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={evaluating || showFeedback}
              placeholder={t.placeholder}
              className={`w-full h-80 md:h-[550px] p-12 sm:p-20 md:p-24 rounded-[3rem] md:rounded-[5.5rem] border-0 transition-all text-2xl sm:text-3xl md:text-4xl font-medium leading-relaxed resize-none outline-none shadow-inner ${
                isListening 
                ? 'bg-red-50/20 ring-4 md:ring-[25px] ring-red-500/10' 
                : showFeedback
                ? 'bg-slate-50 opacity-80'
                : 'bg-slate-50/50 focus:bg-white focus:ring-[20px] focus:ring-indigo-500/5'
              }`}
            />
            
            {!showFeedback && (
              <div className={`absolute bottom-10 md:bottom-24 ${uiLang === UiLanguage.AR ? 'left-12 md:left-24' : 'right-12 md:right-24'} flex items-center gap-8 md:gap-12`}>
                <button
                  onClick={toggleListening}
                  className={`w-24 h-24 md:w-44 md:h-44 rounded-full flex items-center justify-center transition-all shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] relative z-20 shrink-0 ${
                    isListening ? 'bg-red-500 text-white animate-pulse scale-110 shadow-red-500/60' : 'bg-white text-slate-400 hover:text-indigo-600 hover:scale-110 shadow-slate-200'
                  }`}
                >
                  {isListening ? (
                    <div className="flex gap-2 md:gap-3 items-center">
                      <div className="w-2 md:w-4 h-8 md:h-14 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 md:w-4 h-14 md:h-24 bg-white rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 md:w-4 h-10 md:h-18 bg-white rounded-full animate-bounce delay-150"></div>
                      <div className="w-2 md:w-4 h-8 md:h-14 bg-white rounded-full animate-bounce delay-200"></div>
                    </div>
                  ) : (
                    <svg className="w-12 h-12 md:w-20 md:h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z"/></svg>
                  )}
                </button>
                
                {isListening && (
                   <div className="hidden lg:flex flex-col items-start gap-2">
                      <span className="text-[12px] md:text-[15px] font-black text-red-500 uppercase tracking-[0.6em]">{t.live} AI CAPTURE</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Studio Quality Sampling</span>
                   </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Evaluation Card - Deep Polish */}
        {showFeedback && currentEvaluation && (
          <div className="mt-20 md:mt-32 p-12 md:p-32 bg-slate-900 rounded-[3.5rem] md:rounded-[6rem] shadow-[0_80px_160px_-30px_rgba(15,23,42,0.6)] text-white animate-in slide-in-from-top-16 duration-800 text-start relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row gap-16 md:gap-28 items-start relative z-10">
              <div className="relative shrink-0 mx-auto md:mx-0">
                <svg className="w-40 h-40 md:w-64 md:h-64 transform -rotate-90">
                  <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/10 md:hidden" />
                  <circle cx="128" cy="128" r="115" stroke="currentColor" strokeWidth="20" fill="transparent" className="hidden md:block text-white/10" />
                  
                  {/* Desktop Score Ring */}
                  <circle cx="128" cy="128" r="115" stroke="currentColor" strokeWidth="20" fill="transparent" 
                    className={`${currentEvaluation.score >= 80 ? 'text-emerald-400' : currentEvaluation.score >= 50 ? 'text-amber-400' : 'text-rose-400'} hidden md:block progress-ring`}
                    strokeDasharray="722.5"
                    strokeDashoffset={722.5 - (722.5 * currentEvaluation.score) / 100}
                    strokeLinecap="round"
                  />
                  {/* Smaller Ring for Tablet */}
                  <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" 
                    className={`${currentEvaluation.score >= 80 ? 'text-emerald-400' : currentEvaluation.score >= 50 ? 'text-amber-400' : 'text-rose-400'} md:hidden progress-ring`}
                    strokeDasharray="452.3"
                    strokeDashoffset={452.3 - (452.3 * currentEvaluation.score) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl md:text-8xl font-black">{currentEvaluation.score}</span>
                  <span className="text-[10px] md:text-[14px] font-black opacity-40 uppercase tracking-[0.5em] mt-3">Proficiency</span>
                </div>
              </div>

              <div className="flex-grow w-full">
                <div className="flex items-center gap-6 mb-12 md:mb-16">
                  <h3 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-center md:text-start w-full md:w-auto leading-tight">
                    {currentEvaluation.score >= 80 
                      ? (uiLang === UiLanguage.AR ? 'أداء متميز' : 'MASTERFUL INSIGHT')
                      : currentEvaluation.score >= 50
                      ? (uiLang === UiLanguage.AR ? 'أداء جيد جداً' : 'CORE COMPETENCY')
                      : (uiLang === UiLanguage.AR ? 'مساحة للتطوير' : 'REFINEMENT NEEDED')
                    }
                  </h3>
                </div>
                <p className="text-indigo-100/80 leading-relaxed font-bold text-2xl md:text-4xl mb-16 md:mb-24 italic text-center md:text-start px-4">
                  "{currentEvaluation.feedback}"
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
                  <div className="bg-white/5 p-12 rounded-[3.5rem] border border-white/5 backdrop-blur-xl">
                    <h4 className="text-[12px] md:text-[15px] font-black text-emerald-400 uppercase tracking-[0.6em] mb-10">Dominant Highlights</h4>
                    <ul className="space-y-6 md:space-y-10">
                      {currentEvaluation.positives.map((p, i) => (
                        <li key={i} className="flex gap-6 text-lg md:text-2xl font-bold text-slate-100 leading-tight">
                          <span className="shrink-0 text-emerald-400 text-2xl md:text-3xl">✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white/5 p-12 rounded-[3.5rem] border border-white/5 backdrop-blur-xl">
                    <h4 className="text-[12px] md:text-[15px] font-black text-rose-400 uppercase tracking-[0.6em] mb-10">Critical Precision</h4>
                    <ul className="space-y-6 md:space-y-10">
                      {currentEvaluation.improvements.map((im, i) => (
                        <li key={i} className="flex gap-6 text-lg md:text-2xl font-bold text-slate-100 leading-tight">
                          <span className="shrink-0 text-rose-400 text-2xl md:text-3xl">!</span>
                          <span>{im}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-20 md:mt-32 flex justify-center md:justify-end">
              <button
                onClick={handleProceed}
                className="group w-full sm:w-auto px-16 md:px-28 py-8 md:py-10 bg-white text-slate-900 rounded-[2.5rem] md:rounded-[4rem] font-black uppercase tracking-[0.4em] hover:bg-slate-100 transition-all shadow-3xl active:scale-95 flex items-center justify-center gap-8"
              >
                <span className="text-xl md:text-3xl">{currentIndex === questions.length - 1 ? t.finish : t.next}</span>
                <svg className={`w-8 h-8 md:w-12 md:h-12 transition-transform group-hover:translate-x-6 ${uiLang === UiLanguage.AR ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {!showFeedback && (
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-16 px-6">
          <div className="flex items-center justify-center md:justify-start gap-12 md:gap-20 w-full md:w-auto bg-white/60 backdrop-blur-md py-10 md:py-12 px-12 md:px-20 rounded-[3rem] md:rounded-[4rem] border border-slate-200">
            <div className="flex flex-col items-center md:items-start text-center md:text-start">
              <span className="text-[11px] md:text-[14px] font-black text-slate-300 uppercase tracking-[0.5em] mb-3">Linguistic Depth</span>
              <span className="text-3xl md:text-5xl font-black text-slate-900 leading-none">{userAnswer.split(/\s+/).filter(Boolean).length} <span className="text-slate-300 text-base md:text-2xl font-bold uppercase ml-3">Tokens</span></span>
            </div>
            <div className="w-px h-16 bg-slate-200 shrink-0"></div>
            <div className="flex flex-col items-center md:items-start text-center md:text-start">
              <span className="text-[11px] md:text-[14px] font-black text-slate-300 uppercase tracking-[0.5em] mb-3">AI Verdict</span>
              <span className="text-base md:text-2xl font-black text-indigo-600 uppercase tracking-[0.3em] leading-none">Awaiting</span>
            </div>
          </div>
          
          <button
            onClick={handleSubmitAnswer}
            disabled={!userAnswer.trim() || evaluating}
            className={`btn-premium group w-full md:w-auto px-20 md:px-32 py-8 md:py-12 rounded-[2.5rem] md:rounded-[4.5rem] font-black text-xl md:text-3xl uppercase tracking-[0.3em] text-white flex items-center justify-center gap-8 md:gap-12 ${
              !userAnswer.trim() || evaluating
                ? 'opacity-40 grayscale pointer-events-none'
                : ''
            }`}
          >
            <span className="text-xl md:text-2xl font-black">{uiLang === UiLanguage.AR ? 'تحليل الإجابة' : 'SUBMIT VERDICT'}</span>
            <svg className="w-10 h-10 md:w-14 md:h-14 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </button>
        </div>
      )}
    </div>
  );
};
