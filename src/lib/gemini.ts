/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Question, Subject } from "../types";
import { api } from "./api";

// Standard client-side Gemini initialization for AI Studio Applets
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateQuestion(subject: Subject, grade: number, level: number, topic?: string): Promise<Question> {
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
    ${topic ? `SPECIFIC TOPIC: ${topic}` : ""}
    
    ${context ? `Use the following reference material to base your question on:\n---START REFERENCE---\n${context}\n---END REFERENCE---` : ""}
    
    CRITICAL: 
    - Use Zimbabwean context (names like Chipo, Tendai; places like Harare, Gweru).
    - For Mathematics: use ZiG (Zimbabwe Gold) currency or common items like bread/eggs.
    - For Indigenous Languages: focus on Shona or Ndebele common phrases or grammar (Gwedema style).
    - For Agriculture, Science and Technology: discuss local plants, soil types (sandy/loam), or rain patterns.
    - For Social Science: mention Zimbabwean history, monuments (Great Zimbabwe), or patriotic concepts.
    - For Physical Education: mention local sports or traditional games like 'nhodo' or 'tsoro'.
    - For English Language: focus on grammar and reading comprehension suitable for Grade ${grade}.
    - The topic is ${topic || "General"}.
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

export async function generateTopicSummary(subject: Subject, grade: number, topic: string): Promise<string> {
  // Fetch relevant local resources to use as context
  let context = "";
  try {
    context = await api.getAiContext(subject, grade);
  } catch (err) {
    console.warn("Could not fetch resources context", err);
  }

  const prompt = `
    You are an expert Zimbabwean Primary School teacher.
    Provide a very brief, engaging 3-sentence "Lesson Summary" for a Grade ${grade} student on the topic: "${topic}" in the subject of ${subject}.
    
    ${context ? `Use the following reference material to base your summary on:\n---START REFERENCE---\n${context}\n---END REFERENCE---` : ""}

    Guidelines:
    - Use clear, simple language suitable for a child.
    - Mention one interesting fact relevant to Zimbabwe.
    - End with a motivational sentence encouraging them to start the quiz.
    - If reference material is provided, prioritize information from it.
  `;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return result.text || "Let's review what we know about this topic and do our best!";
  } catch (error) {
    return "Ready to test your knowledge? Let's dive into some practice questions!";
  }
}

export async function summarizeDocument(title: string, content: string): Promise<string> {
  const prompt = `
    Summarize the following educational material titled "${title}".
    The summary should be structured for a teacher as a "Resource Digest" and include:
    1. A high-level overview of the document (2-3 sentences).
    2. 3-5 main educational points or learning objectives covered.
    3. How this resource specifically relates to the Zimbabwean primary curriculum if applicable.
    
    CONTENT:
    ${content.substring(0, 30000)} // Limiting to 30k chars for safety
    
    Use professional but accessible language. Keep it concise.
  `;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return result.text || "Could not generate summary.";
  } catch (error) {
    console.error("Summarization Error:", error);
    return "Error generating AI summary.";
  }
}
