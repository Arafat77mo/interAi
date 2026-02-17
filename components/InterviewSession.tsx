
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
      <div className="flex flex-col items-center justify-center py-40 text-center px-6">
        <div className="relative w-24 h-24 mb-10">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black text-indigo-600">AI</span>
          </div>
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-4">{t.preparing}</h2>
        <p className="text-gray-400 font-medium max-w-sm mx-auto leading-relaxed">
           Curating your premium technical session.
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-5xl mx-auto py-20 px-6 lg:px-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {evaluating && (
        <div className="fixed inset-0 z-[200] bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="w-16 h-1 bg-indigo-600 animate-pulse mb-10"></div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
             {t.analyzing}
          </h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest">{t.reviewingFeedback}</p>
        </div>
      )}

      {showSavedToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[210] glass px-8 py-4 rounded-full premium-shadow flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
          </div>
          <span className="text-sm font-black text-gray-900 uppercase tracking-widest">{t.progressSaved}</span>
        </div>
      )}

      <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="text-start">
          <div className="flex items-center gap-4 mb-3">
             <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-100/50">
               {language.name[uiLang]} • {difficulty}
             </span>
             <div className="w-px h-3 bg-gray-200"></div>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
               {t.questionOf.replace('{current}', (currentIndex + 1).toString()).replace('{total}', questions.length.toString())}
             </span>
          </div>
          <div className="relative h-2 w-64 bg-gray-100 rounded-full overflow-hidden">
             <div className="h-full bg-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleSaveProgress} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
          </button>
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`w-12 h-12 rounded-2xl border transition-all shadow-sm flex items-center justify-center ${voiceEnabled ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-white border-gray-100 text-gray-300'}`}>
            {voiceEnabled ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
            )}
          </button>
          <button onClick={onCancel} className="px-6 py-3 rounded-2xl bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm">
            {t.quit}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] p-10 md:p-20 premium-shadow border border-gray-100/50 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] select-none">
           <span className="text-[12rem] font-black italic">Q{currentIndex + 1}</span>
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <span className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full">
              {currentQuestion.category}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-16 tracking-tight">
            {currentQuestion.text}
          </h1>

          <div className="relative group">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={evaluating || showFeedback}
              placeholder={t.placeholder}
              className={`w-full h-80 p-10 rounded-[2.5rem] border transition-all text-xl font-medium leading-relaxed resize-none outline-none shadow-inner ${
                isListening 
                ? 'bg-red-50/20 border-red-100 ring-4 ring-red-500/5' 
                : showFeedback
                ? 'bg-gray-50 border-gray-200 opacity-80'
                : 'bg-gray-50/50 border-gray-100 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5'
              }`}
            />
            
            {!showFeedback && (
              <div className={`absolute bottom-8 ${uiLang === UiLanguage.AR ? 'left-8' : 'right-8'} flex items-center gap-4`}>
                <button
                  onClick={toggleListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl relative z-20 ${
                    isListening ? 'bg-red-500 text-white animate-pulse scale-110' : 'bg-white text-gray-400 hover:text-indigo-600 hover:scale-110'
                  }`}
                >
                  {isListening ? (
                    <div className="flex gap-1 items-center">
                      <div className="w-1.5 h-4 bg-white rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-8 bg-white rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-6 bg-white rounded-full animate-bounce delay-150"></div>
                      <div className="w-1.5 h-4 bg-white rounded-full animate-bounce delay-200"></div>
                    </div>
                  ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z"/></svg>
                  )}
                </button>
                
                {isListening && (
                   <div className="flex flex-col items-start gap-1">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t.live} AI STT</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Arabic & English Auto-Detect</span>
                   </div>
                )}
              </div>
            )}
            
            {interimTranscript && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-6 py-3 bg-white border border-indigo-100 rounded-full shadow-xl text-indigo-600 text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 flex items-center gap-3">
                 <div className="flex gap-0.5">
                    <div className="w-1 h-2 bg-indigo-600 animate-pulse"></div>
                    <div className="w-1 h-3 bg-indigo-600 animate-pulse delay-75"></div>
                    <div className="w-1 h-2 bg-indigo-600 animate-pulse delay-150"></div>
                 </div>
                 <span className="opacity-50 uppercase">{uiLang === UiLanguage.AR ? 'جاري الاستماع' : 'LISTENING'}:</span> 
                 <span className="lowercase">{interimTranscript}</span>
              </div>
            )}
          </div>
        </div>

        {showFeedback && currentEvaluation && (
          <div className="mt-12 p-10 bg-white rounded-[2.5rem] border-2 border-indigo-50 shadow-2xl shadow-indigo-500/5 animate-in slide-in-from-top-4 duration-500 text-start">
            <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
              <div className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center shrink-0 shadow-lg ${
                currentEvaluation.score >= 80 ? 'bg-emerald-50 text-emerald-600' : currentEvaluation.score >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
              }`}>
                <span className="text-3xl font-black">{currentEvaluation.score}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">SCORE</span>
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-2 h-2 rounded-full ${currentEvaluation.score >= 80 ? 'bg-emerald-500' : currentEvaluation.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">
                    {currentEvaluation.score >= 80 
                      ? (uiLang === UiLanguage.AR ? 'أداء ممتاز' : 'EXCELLENT PERFORMANCE')
                      : currentEvaluation.score >= 50
                      ? (uiLang === UiLanguage.AR ? 'أداء جيد' : 'GOOD PERFORMANCE')
                      : (uiLang === UiLanguage.AR ? 'يحتاج تحسين' : 'NEEDS IMPROVEMENT')
                    }
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap italic mb-4">
                  "{currentEvaluation.feedback}"
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  {currentEvaluation.positives.length > 0 && (
                    <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                      <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">What went well</h4>
                      <ul className="space-y-2">
                        {currentEvaluation.positives.map((p, i) => (
                          <li key={i} className="flex gap-2 text-sm font-medium text-emerald-800">
                            <span className="shrink-0">✅</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {currentEvaluation.improvements.length > 0 && (
                    <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
                      <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3">Room for growth</h4>
                      <ul className="space-y-2">
                        {currentEvaluation.improvements.map((im, i) => (
                          <li key={i} className="flex gap-2 text-sm font-medium text-rose-800">
                            <span className="shrink-0">💡</span>
                            <span>{im}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-10 flex justify-end">
              <button
                onClick={handleProceed}
                className="group px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl active:scale-95 flex items-center gap-3"
              >
                <span>{currentIndex === questions.length - 1 ? t.finish : t.next}</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {!showFeedback && (
        <div className="flex justify-between items-center px-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Response Volume</span>
            <span className="text-xl font-black text-gray-900">{userAnswer.split(/\s+/).filter(Boolean).length} WORDS</span>
          </div>
          
          <button
            onClick={handleSubmitAnswer}
            disabled={!userAnswer.trim() || evaluating}
            className={`group px-16 py-6 rounded-2xl font-black text-lg uppercase tracking-[0.2em] transition-all active:scale-[0.98] flex items-center gap-4 ${
              !userAnswer.trim() || evaluating
                ? 'bg-gray-100 text-gray-400 grayscale'
                : 'bg-[#0a0a0b] text-white hover:bg-black shadow-2xl'
            }`}
          >
            <span>{uiLang === UiLanguage.AR ? 'تحقق من الإجابة' : 'CHECK ANSWER'}</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </button>
        </div>
      )}
    </div>
  );
};
