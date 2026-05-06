import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """Connects to the SQLite database."""
    try:
        conn = sqlite3.connect("zim_its.db")
        conn.row_factory = sqlite3.Row  # This allows accessing columns by name
        return conn
    except Exception as e:
        print(f"Error connecting to SQLite: {e}")
        return None

def init_db():
    """Ensures the tables exist in your SQLite database."""
    conn = get_db_connection()
    if conn is None:
        print("❌ Could not connect to SQLite.")
        return
        
    cursor = conn.cursor()
    
    # Students table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            grade INTEGER NOT NULL,
            literacy_level INTEGER DEFAULT 1,
            numeracy_level INTEGER DEFAULT 1,
            total_points INTEGER DEFAULT 0,
            streak INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Achievements table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            achievement_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            icon TEXT,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
    ''')
    
    # Performance Logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS performance_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            subject TEXT NOT NULL,
            correct INTEGER NOT NULL,
            total INTEGER NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ SQLite Database Initialized Successfully!")

if __name__ == "__main__":
    init_db()
