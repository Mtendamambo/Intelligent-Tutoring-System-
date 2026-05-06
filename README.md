# ZimPrimary Intelligent Tutoring System (ITS)

An AI-powered Intelligent Tutoring System specifically designed for Zimbabwean Primary School learners (Grade 3-7).

## Features
- **Adaptive AI Tutoring:** Uses Google Gemini to generate custom questions based on the student's current level.
- **Local Context:** Math and Literacy questions are contextualized to Zimbabwe (Harare, Bulawayo, ZiG currency, local folklore).
- **Progressive Web App (PWA):** Installable on Windows, macOS, and Android/iOS.
- **Gamified Learning:** Earn points, level up, and unlock awards.

## How to Run Locally on your PC

### Prerequisites
1. Install **Node.js** (Version 18 or later) from [nodejs.org](https://nodejs.org/).
2. A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).

### Setup Instructions
1. Download or clone this repository to a folder on your computer.
2. Open your terminal (Command Prompt or PowerShell) in that folder.
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and add your API key:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open your browser to `http://localhost:3000`.

## Deployment
This app is ready to be deployed to platforms like Cloud Run, Vercel, or Netlify.
To build for production:
```bash
npm run build
```
The static files will be in the `dist/` folder.
