
import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, Question, UiLanguage, Language } from "../types";

export interface DetailedEvaluation {
  feedback: string;
  positives: string[];
  improvements: string[];
  score: number;
}

export class GeminiService {
  async extractSkillsFromJd(jdText: string, uiLang: UiLanguage): Promise<Language[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langInstructions = uiLang === UiLanguage.AR ? "Return descriptions in Arabic." : "Return descriptions in English.";
    
    const prompt = `Analyze the following Job Description and extract exactly the main programming languages, frameworks, and technical tools mentioned.
    For each tool/language:
    1. Provide a unique ID.
    2. Provide names in both English and Arabic.
    3. Choose a representative emoji icon.
    4. Write a short description in both languages.

    Job Description:
    "${jdText}"

    ${langInstructions}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: {
                  type: Type.OBJECT,
                  properties: {
                    en: { type: Type.STRING },
                    ar: { type: Type.STRING }
                  },
                  required: ["en", "ar"]
                },
                icon: { type: Type.STRING },
                description: {
                  type: Type.OBJECT,
                  properties: {
                    en: { type: Type.STRING },
                    ar: { type: Type.STRING }
                  },
                  required: ["en", "ar"]
                }
              },
              required: ["id", "name", "icon", "description"]
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (e: any) {
      console.error("Failed to extract skills", e);
      return [];
    }
  }

  async generateQuestions(language: string, difficulty: Difficulty, uiLang: UiLanguage, count: number = 5, jobDescription?: string): Promise<Question[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langInstructions = uiLang === UiLanguage.AR ? "Return all text in Arabic." : "Return all text in English.";
    
    let prompt = `Generate ${count} professional technical interview questions for a ${difficulty} level ${language} developer. ${langInstructions}`;
    
    if (jobDescription) {
      prompt += `\n\nTailor the questions specifically to the requirements, skills, and responsibilities mentioned in this Job Description:\n"${jobDescription}"`;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ["id", "text", "category"]
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (e: any) {
      console.error("Failed to parse questions", e);
      return [];
    }
  }

  async evaluateAnswer(question: string, answer: string, language: string, difficulty: Difficulty, uiLang: UiLanguage, jobDescription?: string): Promise<DetailedEvaluation> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langInstructions = uiLang === UiLanguage.AR 
      ? "Provide feedback, positives, and improvements in Arabic." 
      : "Provide feedback, positives, and improvements in English.";
    
    let context = `${difficulty} ${language} interview.`;
    if (jobDescription) {
      context += ` The interview is based on this Job Description: "${jobDescription}"`;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Evaluate the following interview answer with high technical granularity.
        Question: "${question}"
        User Answer: "${answer}"
        Context: ${context}
        ${langInstructions}
        
        Requirements:
        1. "feedback": A concise executive summary of the performance.
        2. "positives": A list of specific technical strengths or correct points mentioned.
        3. "improvements": A list of specific missing technical details, inaccuracies, or better ways to phrase/architect the solution.
        4. "score": A score from 0 to 100 based on technical depth and accuracy.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              feedback: { type: Type.STRING },
              positives: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              score: { type: Type.NUMBER }
            },
            required: ["feedback", "positives", "improvements", "score"]
          }
        }
      });
      return JSON.parse(response.text);
    } catch (e: any) {
      console.error("Evaluation failed", e);
      return { 
        feedback: "Could not evaluate at this time.", 
        positives: [], 
        improvements: ["Check your internet connection or API key."], 
        score: 0 
      };
    }
  }
}

export const geminiService = new GeminiService();
