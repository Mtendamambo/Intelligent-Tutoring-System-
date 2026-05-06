/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { Question, Subject } from "../types";

// Standard client-side Gemini initialization for AI Studio Applets
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateQuestion(subject: Subject, grade: number, level: number): Promise<Question> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
  });

  const prompt = `
    You are an expert Zimbabwean Primary School tutor. 
    Generate a ${subject} question for a Grade ${grade} student at difficulty Level ${level}/10.
    
    CRITICAL: 
    - Use Zimbabwean context (names like Chipo, Tendai; places like Harare, Gweru).
    - If subject is Numeracy, use ZiG (Zimbabwe Gold) currency or common items like tomatoes/bread.
    - Return a valid JSON object matching the Question interface:
      {
        "id": "unique_id",
        "text": "The question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "The exact string from options that is correct",
        "explanation": "Brief explanation of why this is correct"
      }
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    return JSON.parse(result.response.text() || "{}");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Fallback question
    return {
      id: "fallback",
      text: subject === 'Numeracy' ? "If Chipo has 5 apples and Tendai gives her 3 more, how many does she have?" : "Which word is a noun in this sentence: 'The dog barked'?",
      options: subject === 'Numeracy' ? ["2", "5", "8", "10"] : ["The", "dog", "barked", "red"],
      correctAnswer: subject === 'Numeracy' ? "8" : "dog",
      explanation: "Basic addition/grammar."
    };
  }
}

export async function getFeedback(question: Question, studentAnswer: string, isCorrect: boolean): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Student answered "${studentAnswer}" to the question: "${question.text}".
    The correct answer is "${question.correctAnswer}".
    The student was ${isCorrect ? 'CORRECT' : 'INCORRECT'}.
    
    Provide a warm, encouraging 1-sentence feedback in a Zimbabwean friendly tone (use words like "Shupa", "Well done", or "Keep trying, mukoma/Sisi").
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    return result.response.text() || "";
  } catch (error) {
    return isCorrect ? "Great job! Keep going!" : "Not quite, but you are learning fast! Try another one.";
  }
}
