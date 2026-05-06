/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Question, Subject } from "../types";
import { api } from "./api";

// Standard client-side Gemini initialization for AI Studio Applets
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateQuestion(subject: Subject, grade: number, level: number): Promise<Question> {
  // Fetch relevant local resources to use as context
  let context = "";
  try {
    context = await api.getAiContext(subject, grade);
  } catch (err) {
    console.warn("Could not fetch resources context", err);
  }

  const prompt = `
    You are an expert Zimbabwean Primary School tutor. 
    Generate a ${subject} question for a Grade ${grade} student at difficulty Level ${level}/10.
    
    ${context ? `Use the following reference material to base your question on:\n---START REFERENCE---\n${context}\n---END REFERENCE---` : ""}
    
    CRITICAL: 
    - Use Zimbabwean context (names like Chipo, Tendai; places like Harare, Gweru).
    - For Mathematics: use ZiG (Zimbabwe Gold) currency or common items like bread/eggs.
    - For Indigenous Languages: focus on Shona or Ndebele common phrases or grammar (Gwedema style).
    - For Agriculture, Science and Technology: discuss local plants, soil types (sandy/loam), or rain patterns.
    - For Social Science: mention Zimbabwean history, monuments (Great Zimbabwe), or patriotic concepts.
    - For Physical Education: mention local sports or traditional games like 'nhodo' or 'tsoro'.
    - For English Language: focus on grammar and reading comprehension suitable for Grade ${grade}.
    - Return a valid JSON object matching the Question interface.
  `;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            subject: { type: Type.STRING, enum: [
              "Indigenous Languages", 
              "Mathematics", 
              "Social Science", 
              "Agriculture, Science and Technology", 
              "Physical Education", 
              "English Language"
            ] },
            topic: { type: Type.STRING },
            text: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            difficulty: { type: Type.INTEGER }
          },
          required: ["id", "subject", "topic", "text", "options", "correctAnswer", "explanation", "difficulty"]
        }
      }
    });

    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Fallback question
    return {
      id: "fallback",
      subject: subject,
      topic: "General",
      text: subject === 'Mathematics' ? "If Chipo has 5 apples and Tendai gives her 3 more, how many does she have?" : "Which word is a noun in this sentence: 'The dog barked'?",
      options: subject === 'Mathematics' ? ["2", "5", "8", "10"] : ["The", "dog", "barked", "red"],
      correctAnswer: subject === 'Mathematics' ? "8" : "dog",
      explanation: "Basic addition/grammar.",
      difficulty: level
    };
  }
}

export async function getFeedback(question: Question, studentAnswer: string, isCorrect: boolean): Promise<string> {
  const prompt = `
    Student answered "${studentAnswer}" to the question: "${question.text}".
    The correct answer is "${question.correctAnswer}".
    The student was ${isCorrect ? 'CORRECT' : 'INCORRECT'}.
    
    Provide a warm, encouraging 1-sentence feedback in a Zimbabwean friendly tone (use words like "Shupa", "Well done", or "Keep trying, mukoma/Sisi").
  `;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return result.text || (isCorrect ? "Great job! Keep going!" : "Not quite, but you are learning fast! Try another one.");
  } catch (error) {
    return isCorrect ? "Great job! Keep going!" : "Not quite, but you are learning fast! Try another one.";
  }
}
