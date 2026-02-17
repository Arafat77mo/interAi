
import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, Question, UiLanguage, Language } from "../types";

export class GeminiService {
  private async handleInvalidKeyError(error: any) {
    if (error?.message?.includes('API key not valid') || error?.message?.includes('Requested entity was not found')) {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        // Force re-selection as per guidelines
        await (window as any).aistudio.openSelectKey();
      }
    }
  }

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
      await this.handleInvalidKeyError(e);
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
      await this.handleInvalidKeyError(e);
      console.error("Failed to parse questions", e);
      return [];
    }
  }

  async evaluateAnswer(question: string, answer: string, language: string, difficulty: Difficulty, uiLang: UiLanguage, jobDescription?: string): Promise<{ feedback: string, score: number }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langInstructions = uiLang === UiLanguage.AR ? "Provide feedback in Arabic." : "Provide feedback in English.";
    
    let context = `${difficulty} ${language} interview.`;
    if (jobDescription) {
      context += ` The interview is based on this Job Description: "${jobDescription}"`;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Evaluate the following interview answer. 
        Question: "${question}"
        User Answer: "${answer}"
        Context: ${context}
        ${langInstructions}
        Provide constructive feedback and a score from 0 to 100.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              feedback: { type: Type.STRING },
              score: { type: Type.NUMBER }
            },
            required: ["feedback", "score"]
          }
        }
      });
      return JSON.parse(response.text);
    } catch (e: any) {
      await this.handleInvalidKeyError(e);
      return { feedback: "Could not evaluate at this time. Please check your API key.", score: 0 };
    }
  }
}

export const geminiService = new GeminiService();
