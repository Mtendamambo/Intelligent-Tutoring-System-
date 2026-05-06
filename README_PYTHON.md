# ZimPrimary ITS - Python Setup Guide

This project has been converted to Python for easier local use and configuration.

## Prerequisites
1. Install Python from [python.org](https://www.python.org/)
2. Get a Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

## Installation

1. Download the ZIP file of this project.
2. Open your terminal (CMD on Windows).
3. Navigate to the project folder.
4. Install the required libraries:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration
Create a file named `.env` in the root folder and add your API key:
```env
GEMINI_API_KEY=your_actual_key_here
```

## Running the Application

1. Start the Python Backend:
   ```bash
   python app.py
   ```
   *The server will start on http://127.0.0.1:5000*

2. Open the frontend:
   - If you want to use the React version, you will need to run `npm install` and `npm run dev`.
   - The React frontend is configured to talk to the backend.

## Why Python?
- **SQLite Database**: Unlike the MySQL version, this Python version uses SQLite, which is a single file (`zim_primary_its.db`). You don't need to install WAMP or any database server.
- **Readable Logic**: The AI generation and student tracking are now in simple Python scripts (`app.py`, `gemini_service.py`).
