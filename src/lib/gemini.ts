import { GoogleGenAI, Type } from "@google/genai";
import { Subject, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateQuestion(subject: Subject, grade: number, level: number): Promise<Question> {
  const prompt = `Generate a primary school ${subject} question for a Grade ${grade} student in Zimbabwe. 
  The difficulty level relative to the grade is ${level}/10. 
  The context should be relatable to a Zimbabwean child (use names like Tinashe, Farai, Chipo, or references to places like Harare, Bulawayo, or local currency/items).
  Return the response in JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            subject: { type: Type.STRING },
            topic: { type: Type.STRING },
            text: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            difficulty: { type: Type.NUMBER }
          },
          required: ["id", "subject", "topic", "text", "options", "correctAnswer", "explanation", "difficulty"]
        }
      }
    });

    return JSON.parse(response.text) as Question;
  } catch (error) {
    console.error("Error generating question:", error);
    // Fallback static question if AI fails
    return {
      id: "fallback-1",
      subject,
      topic: subject === 'Numeracy' ? 'Addition' : 'Vocabulary',
      text: subject === 'Numeracy' ? "If Farai has 5 mangoes and Chipo gives him 3 more, how many does he have?" : "Which word means the same as 'Happy'?",
      options: subject === 'Numeracy' ? ["7", "8", "9", "10"] : ["Sad", "Joyful", "Angry", "Tired"],
      correctAnswer: subject === 'Numeracy' ? "8" : "Joyful",
      explanation: subject === 'Numeracy' ? "5 + 3 equals 8." : "Joyful is a synonym for happy.",
      difficulty: level
    };
  }
}

export async function getFeedback(question: Question, studentAnswer: string, isCorrect: boolean): Promise<string> {
    const prompt = `Student answered "${studentAnswer}" to the question: "${question.text}". 
    The correct answer is "${question.correctAnswer}". 
    The student was ${isCorrect ? "correct" : "incorrect"}.
    Provide a warm, encouraging, and educational feedback message for a Grade 5 student in Zimbabwe. Keep it brief.`;
  
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      return response.text.trim();
    } catch (e) {
      return isCorrect ? "Great job! Keep going!" : `Not quite. The correct answer was ${question.correctAnswer}. ${question.explanation}`;
    }
}
