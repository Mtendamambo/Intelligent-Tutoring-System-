import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure the API Key
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

model = genai.GenerativeModel('gemini-1.5-flash')

def generate_question(subject, grade, level):
    """Generates a Zimbabwean-contextualized question."""
    prompt = f"""
    Generate a primary school {subject} question for a Grade {grade} student in Zimbabwe. 
    The difficulty level relative to the grade is {level}/10. 
    The context should be relatable to a Zimbabwean child (use names like Tinashe, Farai, Chipo, or references to places like Harare, Bulawayo, or local currency/items like ZiG).
    
    Return the response ONLY in JSON format with these keys:
    id, subject, topic, text, options (list of 4), correctAnswer, explanation, difficulty.
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"AI Generation Error: {e}")
        # Fallback
        return {
            "id": "fallback",
            "subject": subject,
            "topic": "General",
            "text": "If Tinashe has 5 mangoes and gives 2 to Chipo, how many are left?",
            "options": ["2", "3", "4", "5"],
            "correctAnswer": "3",
            "explanation": "5 minus 2 is 3.",
            "difficulty": level
        }

def get_feedback(question_text, student_answer, correct_answer, is_correct):
    """Generates encouraging feedback."""
    status = "correct" if is_correct else "incorrect"
    prompt = f"""
    Student answered '{student_answer}' to the question: '{question_text}'. 
    The correct answer is '{correct_answer}'. 
    The student was {status}.
    Provide a warm, encouraging, and educational feedback message for a Grade {status} student in Zimbabwe. Keep it brief.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except:
        return "Well done! Keep practicing!" if is_correct else f"Keep trying! The answer was {correct_answer}."
