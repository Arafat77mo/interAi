
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
      <div className="flex flex-col items-center justify-center py-32 md:py-56 text-center px-6">
        <div className="relative w-24 h-24 md:w-32 md:h-32 mb-10">
          <div className="absolute inset-0 border-4 md:border-8 border-indigo-100 rounded-2xl md:rounded-3xl rotate-45"></div>
          <div className="absolute inset-0 border-4 md:border-8 border-indigo-600 rounded-2xl md:rounded-3xl border-t-transparent animate-spin rotate-45"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl md:text-4xl font-bold text-indigo-600 uppercase">AI</span>
          </div>
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">{t.preparing}</h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">
           Personalizing Your Interview Suite
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-5xl mx-auto py-10 md:py-20 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700">
      
      {/* Evaluation Overlay */}
      {evaluating && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl animate-bounce mb-8 shadow-xl flex items-center justify-center">
             <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
             {t.analyzing}
          </h2>
          <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs md:text-sm">{t.reviewingFeedback}</p>
        </div>
      )}

      {/* Progress Bar Header */}
      <div className="mb-12 md:mb-20 flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="text-start flex-1 max-w-2xl">
          <div className="flex items-center gap-4 md:gap-6 mb-6">
             <div className="w-14 h-14 md:w-20 md:h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl md:text-5xl shadow-lg shrink-0">
               {language.icon}
             </div>
             <div>
               <h4 className="text-xl md:text-3xl font-bold text-slate-900 tracking-tight leading-none">{language.name[uiLang]}</h4>
               <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Proficiency: {difficulty}</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative h-2 md:h-3 flex-1 bg-slate-200/50 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-[11px] md:text-[13px] font-bold text-indigo-600 uppercase tracking-widest shrink-0">
               {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button onClick={handleSaveProgress} className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
          </button>
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`w-12 h-12 rounded-xl border transition-all flex items-center justify-center ${voiceEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-300'}`}>
            {voiceEnabled ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
            )}
          </button>
          <button onClick={onCancel} className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-all shadow-sm">
            {t.quit}
          </button>
        </div>
      </div>

      {/* Main Question Card - Sensible Heights & Typography */}
      <div className="bg-white rounded-3xl p-8 md:p-16 premium-shadow border border-slate-100 mb-12 relative overflow-hidden">
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <span className="px-5 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full leading-none">
              {currentQuestion.category}
            </span>
          </div>
          
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-12 md:mb-20 tracking-tight">
            {currentQuestion.text}
          </h1>

          <div className="relative">
            {/* Live Transcription Bar */}
            {(isListening || interimTranscript) && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full px-4 z-40 flex justify-center">
                <div className="bg-white border border-indigo-100 rounded-full px-6 py-3 shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-400 w-full max-w-2xl border-b-4 border-b-indigo-500">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping"></span>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">LIVE</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200 shrink-0"></div>
                  <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm md:text-base font-semibold text-slate-700 lowercase italic text-start">
                    {interimTranscript || (uiLang === UiLanguage.AR ? 'نحن نستمع إليك...' : 'Ready for your insight...')}
                  </div>
                </div>
              </div>
            )}

            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={evaluating || showFeedback}
              placeholder={t.placeholder}
              className={`w-full min-h-[300px] md:min-h-[400px] p-8 md:p-12 rounded-2xl border-0 transition-all text-lg md:text-xl font-medium leading-relaxed resize-none outline-none shadow-inner ${
                isListening 
                ? 'bg-red-50/10 ring-4 ring-red-500/5' 
                : showFeedback
                ? 'bg-slate-50 opacity-80'
                : 'bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/5'
              }`}
            />
            
            {!showFeedback && (
              <div className={`absolute bottom-6 md:bottom-10 ${uiLang === UiLanguage.AR ? 'left-6 md:left-10' : 'right-6 md:right-10'} flex items-center gap-4`}>
                <button
                  onClick={toggleListening}
                  className={`w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all shadow-xl relative z-20 shrink-0 border-4 border-white ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-400 hover:text-indigo-600'
                  }`}
                >
                  {isListening ? (
                    <div className="flex gap-1.5 items-center">
                      <div className="w-1.5 h-6 bg-white rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-10 bg-white rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-6 bg-white rounded-full animate-bounce delay-150"></div>
                    </div>
                  ) : (
                    <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z"/></svg>
                  )}
                </button>
                
                {isListening && (
                   <div className="hidden md:flex flex-col items-start gap-1">
                      <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest">{t.live} MIC</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Capture</span>
                   </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Evaluation Card - Responsive Grid and Text */}
        {showFeedback && currentEvaluation && (
          <div className="mt-12 p-8 md:p-12 bg-slate-900 rounded-[2rem] shadow-2xl text-white animate-in slide-in-from-top-8 duration-700 text-start relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none"></div>
            
            <div className="flex flex-col lg:flex-row gap-10 md:gap-16 items-start relative z-10">
              <div className="relative shrink-0 mx-auto lg:mx-0">
                <svg className="w-32 h-32 md:w-48 md:h-48 transform -rotate-90">
                  <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="4" fill="transparent" className="md:hidden text-white/10" />
                  <circle cx="96" cy="96" r="85" stroke="currentColor" strokeWidth="12" fill="transparent" className="hidden md:block text-white/10" />
                  
                  {/* Score Ring Responsive */}
                  <circle cx="96" cy="96" r="85" stroke="currentColor" strokeWidth="12" fill="transparent" 
                    className={`${currentEvaluation.score >= 80 ? 'text-emerald-400' : currentEvaluation.score >= 50 ? 'text-amber-400' : 'text-rose-400'} hidden md:block progress-ring`}
                    strokeDasharray="534.1"
                    strokeDashoffset={534.1 - (534.1 * currentEvaluation.score) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl md:text-6xl font-black leading-none">{currentEvaluation.score}</span>
                  <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest mt-2 leading-none">Score</span>
                </div>
              </div>

              <div className="flex-grow w-full">
                <h3 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-center lg:text-start mb-6">
                  {currentEvaluation.score >= 80 
                    ? (uiLang === UiLanguage.AR ? 'أداء متميز' : 'Exceptional Performance')
                    : currentEvaluation.score >= 50
                    ? (uiLang === UiLanguage.AR ? 'أداء جيد جداً' : 'Solid Understanding')
                    : (uiLang === UiLanguage.AR ? 'مساحة للتطوير' : 'Room for Growth')
                  }
                </h3>
                <p className="text-indigo-100 font-medium text-lg md:text-xl mb-12 italic text-center lg:text-start leading-relaxed opacity-90">
                  "{currentEvaluation.feedback}"
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 p-8 rounded-2xl border border-white/5 backdrop-blur-md">
                    <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-6">Technical Strengths</h4>
                    <ul className="space-y-4">
                      {currentEvaluation.positives.map((p, i) => (
                        <li key={i} className="flex gap-4 text-base font-bold text-slate-100 leading-snug">
                          <span className="shrink-0 text-emerald-400">✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white/5 p-8 rounded-2xl border border-white/5 backdrop-blur-md">
                    <h4 className="text-[11px] font-bold text-rose-400 uppercase tracking-widest mb-6">Growth Areas</h4>
                    <ul className="space-y-4">
                      {currentEvaluation.improvements.map((im, i) => (
                        <li key={i} className="flex gap-4 text-base font-bold text-slate-100 leading-snug">
                          <span className="shrink-0 text-rose-400">!</span>
                          <span>{im}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 flex justify-center lg:justify-end">
              <button
                onClick={handleProceed}
                className="group w-full sm:w-auto px-12 py-5 bg-white text-slate-900 rounded-xl font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-6"
              >
                <span className="text-lg">{currentIndex === questions.length - 1 ? t.finish : t.next}</span>
                <svg className={`w-6 h-6 group-hover:translate-x-2 ${uiLang === UiLanguage.AR ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submission Control Bar */}
      {!showFeedback && (
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-10 px-4">
          <div className="flex items-center justify-center md:justify-start gap-10 bg-white/50 backdrop-blur-sm py-8 px-10 rounded-2xl border border-slate-200">
            <div className="flex flex-col items-center md:items-start text-center md:text-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Response Depth</span>
              <span className="text-2xl font-extrabold text-slate-900 leading-none">{userAnswer.split(/\s+/).filter(Boolean).length} <span className="text-slate-300 text-sm font-bold uppercase ml-2">Words</span></span>
            </div>
            <div className="w-px h-12 bg-slate-200 shrink-0"></div>
            <div className="flex flex-col items-center md:items-start text-center md:text-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AI Scan</span>
              <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest leading-none">Ready</span>
            </div>
          </div>
          
          <button
            onClick={handleSubmitAnswer}
            disabled={!userAnswer.trim() || evaluating}
            className={`btn-premium group w-full md:w-auto px-16 py-6 rounded-2xl font-bold text-lg uppercase tracking-widest text-white flex items-center justify-center gap-6 ${
              !userAnswer.trim() || evaluating
                ? 'opacity-40 grayscale pointer-events-none'
                : ''
            }`}
          >
            <span>{uiLang === UiLanguage.AR ? 'تحليل الإجابة' : 'SUBMIT NOW'}</span>
            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </button>
        </div>
      )}
    </div>
  );
};
