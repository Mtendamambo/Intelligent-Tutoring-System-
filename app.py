from flask import Flask, request, jsonify
from flask_cors import CORS
import database
import gemini_service

app = Flask(__name__)
CORS(app) # Allows the frontend to communicate with Python

# Initialize DB on startup
database.init_db()

@app.route('/api/db-status', methods=['GET'])
def db_status():
    conn = database.get_db_connection()
    connected = conn is not None
    if conn: conn.close()
    return jsonify({"connected": connected, "type": "MySQL"})

@app.route('/api/student/profile', methods=['POST'])
def get_profile():
    data = request.json
    name = data.get('name')
    grade = data.get('grade')
    
    conn = database.get_db_connection()
    if not conn:
        return jsonify({"error": "Database not connected"}), 500
        
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM students WHERE name = %s AND grade = %s", (name, grade))
    student = cursor.fetchone()
    
    if not student:
        cursor.execute("INSERT INTO students (name, grade) VALUES (%s, %s)", (name, grade))
        conn.commit()
        cursor.execute("SELECT * FROM students WHERE id = %s", (cursor.lastrowid,))
        student = cursor.fetchone()
    
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
        "INSERT INTO performance_logs (student_id, subject, correct, total) VALUES (%s, %s, %s, %s)",
        (student_id, data.get('subject'), data.get('correct'), data.get('total'))
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True})

if __name__ == '__main__':
    # When running locally, use port 5000
    app.run(debug=True, port=5000)
