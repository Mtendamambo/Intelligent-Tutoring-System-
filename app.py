from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import database
import gemini_service
import os

app = Flask(__name__, static_folder='dist')
CORS(app) 

# Initialize DB on startup
database.init_db()

def row_to_dict(row):
    return dict(row) if row else None

@app.route('/api/db-status', methods=['GET'])
def db_status():
    conn = database.get_db_connection()
    connected = conn is not None
    if conn: conn.close()
    return jsonify({"connected": connected, "type": "SQLite"})

@app.route('/api/student/profile', methods=['POST'])
def get_profile():
    data = request.json
    name = data.get('name')
    grade = data.get('grade')
    
    conn = database.get_db_connection()
    if not conn:
        return jsonify({"error": "Database not connected"}), 500
        
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE name = ? AND grade = ?", (name, grade))
    row = cursor.fetchone()
    student = row_to_dict(row)
    
    if not student:
        cursor.execute("INSERT INTO students (name, grade) VALUES (?, ?)", (name, grade))
        conn.commit()
        last_id = cursor.lastrowid
        cursor.execute("SELECT * FROM students WHERE id = ?", (last_id,))
        student = row_to_dict(cursor.fetchone())
    
    conn.close()
    return jsonify(student)

@app.route('/api/generate-question', methods=['POST'])
def generate_q():
    data = request.json
    q = gemini_service.generate_question(
        data.get('subject'), 
        data.get('grade'), 
        data.get('level')
    )
    return jsonify(q)

@app.route('/api/student/<int:student_id>/history', methods=['POST'])
def log_performance(student_id):
    data = request.json
    conn = database.get_db_connection()
    if not conn:
        return jsonify({"error": "No DB connection"}), 500
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO performance_logs (student_id, subject, correct, total) VALUES (?, ?, ?, ?)",
        (student_id, data.get('subject'), data.get('correct'), data.get('total'))
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# Serve React App (if built)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # AI Studio requires port 3000
    app.run(debug=True, host='0.0.0.0', port=3000)
