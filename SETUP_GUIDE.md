# Local Setup Guide for Zim ITS (Intelligent Tutoring System)

This guide will help you set up the application on a local machine for presentation without an internet connection, using **WAMP Server** as your database backend.

## 1. Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **WAMP Server** (includes MySQL and phpMyAdmin) - [Download here](https://www.wampserver.com/en/)

## 2. Database Setup (WAMP)

1.  **Start WAMP Server**: Make sure the icon in your system tray is green.
2.  **Open phpMyAdmin**: Right-click the WAMP icon -> Tools -> phpMyAdmin (or go to `http://localhost/phpmyadmin` in your browser).
3.  **Create Database**:
    - Click "New" on the left sidebar.
    - Enter `zim_its` as the database name.
    - Click "Create".
4.  **Import Schema**:
    - Select the `zim_its` database from the sidebar.
    - Click the **"Import"** tab at the top.
    - Choose the `database_schema.sql` file included in this project.
    - Scroll down and click **"Import"**.

## 3. Application Setup

1.  **Extract the Project**: Unzip the project files into a folder of your choice (e.g., `C:\projects\zim-its`).
2.  **Open Terminal**: Open Command Prompt, PowerShell, or Git Bash in that folder.
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
    *Note: Since you will be presenting offline, ensure you run this command once while you still have an internet connection to download the necessary libraries.*

## 4. Configuration

1.  **Create .env file**: Create a file named `.env` in the root directory (where `package.json` is).
2.  **Add Database Credentials**:
    Edit the `.env` file with your local MySQL settings:
    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=zim_its
    GEMINI_API_KEY=your_api_key_here
    ```
    *Note: For WAMP, the default user is `root` and the password is usually empty. If you are presenting offline, the AI features (Gemini) will not work, but the rest of the application (Student Profile, Teacher Dashboard, Quizzes) will function perfectly using the local database.*

## 5. Running the Application

### Development Mode (Recommended for testing)
Runs the server with hot-reload features.
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Production Mode (Faster performance)
Builds the app into static files and runs a production-ready server.
```bash
npm run build
npm start
```

## 6. Offline Presentation Features

- **Local Persistence**: All student progress, logs, and achievements are saved to your local WAMP MySQL database.
- **PWA (Offline Support)**: The app is configured as a Progressive Web App. Once loaded once in your browser, it can be accessed even without the Node.js server running (though database interactions require the server).
- **Static Assets**: All icons and fonts are bundled within the app, so they will render correctly without a CDN.

## 7. Troubleshooting

- **Database Connection Error**: Double-check that WAMP is running (green icon) and your `.env` credentials match.
- **Port Conflict**: If port 3000 is occupied, change the `PORT` constant in `server.ts` or use an environment variable.
- **Node Modules missing**: Run `npm install` before going offline.
