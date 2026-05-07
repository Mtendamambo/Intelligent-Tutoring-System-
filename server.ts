import express from "express";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import mammoth from "mammoth";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

dotenv.config();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Database Connection Pool
  let pool: mysql.Pool | null = null;
  
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "zim_its",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log("Connected to MySQL Database");

    // Basic Migration / Table & Column Check
    try {
      // Ensure tables exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
          disabled BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS students (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          name VARCHAR(255) NOT NULL,
          grade INT NOT NULL,
          total_points INT DEFAULT 0,
          streak INT DEFAULT 0,
          indigenous_languages_level INT DEFAULT 1,
          mathematics_level INT DEFAULT 1,
          social_science_level INT DEFAULT 1,
          agriculture_science_tech_level INT DEFAULT 1,
          physical_education_level INT DEFAULT 1,
          english_language_level INT DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      const [columns]: any = await pool.query("SHOW COLUMNS FROM students");
      const columnNames = columns.map((c: any) => c.Field);
      
      const requiredColumns = [
        'indigenous_languages_level',
        'mathematics_level',
        'social_science_level',
        'agriculture_science_tech_level',
        'physical_education_level',
        'english_language_level',
        'total_points',
        'streak'
      ];

      for (const col of requiredColumns) {
        if (!columnNames.includes(col)) {
          console.log(`Adding missing column ${col} to students table...`);
          await pool.query(`ALTER TABLE students ADD COLUMN ${col} INT DEFAULT ${col.includes('level') ? 1 : 0}`);
        }
      }

      if (!columnNames.includes('user_id')) {
        console.log("Adding missing user_id column to students table...");
        await pool.query("ALTER TABLE students ADD COLUMN user_id INT DEFAULT NULL");
      }

      // Migrations for User Management
      const [userCols]: any = await pool.query("SHOW COLUMNS FROM users");
      const userColNames = userCols.map((c: any) => c.Field);
      
      if (!userColNames.includes('disabled')) {
        console.log("Adding disabled column to users table...");
        await pool.query("ALTER TABLE users ADD COLUMN disabled BOOLEAN DEFAULT FALSE");
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS login_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ip_address VARCHAR(45),
          user_agent TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS resources (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content LONGTEXT NOT NULL,
          subject VARCHAR(255) NOT NULL,
          grade INT NOT NULL,
          summary LONGTEXT DEFAULT NULL,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const [resCols]: any = await pool.query("SHOW COLUMNS FROM resources");
      const resColNames = resCols.map((c: any) => c.Field);
      if (!resColNames.includes('summary')) {
        console.log("Adding summary column to resources table...");
        await pool.query("ALTER TABLE resources ADD COLUMN summary LONGTEXT DEFAULT NULL");
      }
    } catch (migErr) {
      console.error("Migration Error:", migErr);
    }
  } catch (err) {
    console.error("Database connection failed:", err);
  }

  // AUTH API
  app.post("/api/auth/register", async (req, res) => {
    const { username, password, role, name, grade } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });

    try {
      // 1. Create User
      const [userResult]: any = await pool.query(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        [username, password, role || 'student']
      );
      const userId = userResult.insertId;

      let studentId = null;
      // 2. If student, create student profile
      if (role === 'student' && name && grade) {
        const [studentResult]: any = await pool.query(
          "INSERT INTO students (user_id, name, grade) VALUES (?, ?, ?)",
          [userId, name, grade]
        );
        studentId = studentResult.insertId;
      }

      res.json({ success: true, userId, studentId });
    } catch (err: any) {
      console.error("Registration Error:", err);
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: "Username already exists" });
      } else if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
        res.status(500).json({ error: `Database Schema Error: ${err.message}` });
      } else {
        res.status(500).json({ error: `Registration failed: ${err.message || 'Unknown error'}` });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });

    try {
      // Optimized single query with LEFT JOIN to fetch user and student data at once
      const [rows]: any = await pool.query(
        `SELECT 
          u.id as userId, u.username, u.role, u.disabled,
          s.id as studentId, s.name, s.grade, s.total_points, s.streak,
          s.indigenous_languages_level, s.mathematics_level, s.social_science_level,
          s.agriculture_science_tech_level, s.physical_education_level, s.english_language_level
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        WHERE u.username = ? AND u.password = ?
        LIMIT 1`,
        [username, password]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const row = rows[0];

      if (row.disabled) {
        return res.status(403).json({ error: "This account has been disabled. Please contact an administrator." });
      }

      // Record login history
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const ua = req.headers['user-agent'];
      await pool.query(
        "INSERT INTO login_history (user_id, ip_address, user_agent) VALUES (?, ?, ?)",
        [row.userId, ip, ua]
      );
      
      // Construct student profile only if role is student and profile exists
      const studentProfile = (row.role === 'student' && row.studentId) ? {
        id: row.studentId,
        name: row.name,
        grade: row.grade,
        totalPoints: row.total_points,
        streak: row.streak,
        level: {
          'Indigenous Languages': row.indigenous_languages_level,
          'Mathematics': row.mathematics_level,
          'Social Science': row.social_science_level,
          'Agriculture, Science and Technology': row.agriculture_science_tech_level,
          'Physical Education': row.physical_education_level,
          'English Language': row.english_language_level
        }
      } : null;

      res.json({ 
        user: { 
          id: row.userId, 
          username: row.username, 
          role: row.role 
        },
        studentProfile
      });
    } catch (err: any) {
      console.error("Login Error:", err);
      res.status(500).json({ error: `Login failed: ${err.message || 'Unknown error'}` });
    }
  });

  // ADMIN API
  app.get("/api/admin/users", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      const [rows]: any = await pool.query("SELECT id, username, role, disabled, created_at FROM users");
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    const { id } = req.params;
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      await pool.query("DELETE FROM users WHERE id = ?", [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.patch("/api/admin/users/:id/role", async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.post("/api/admin/users/:id/reset-password", async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      await pool.query("UPDATE users SET password = ? WHERE id = ?", [password, id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.patch("/api/admin/users/:id/status", async (req, res) => {
    const { id } = req.params;
    const { disabled } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      await pool.query("UPDATE users SET disabled = ? WHERE id = ?", [disabled, id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.get("/api/admin/users/:id/login-history", async (req, res) => {
    const { id } = req.params;
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      const [rows]: any = await pool.query(
        "SELECT * FROM login_history WHERE user_id = ? ORDER BY login_at DESC LIMIT 50",
        [id]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.get("/api/admin/debug-db", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      const [tables]: any = await pool.query("SHOW TABLES");
      const results: any = {};
      
      for (const tableRow of tables) {
        const tableName = Object.values(tableRow)[0] as string;
        const [columns]: any = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
        results[tableName] = columns;
      }
      
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: "DB Debug Error", details: err });
    }
  });

  // API Routes
  app.get("/api/db-status", async (req, res) => {
    try {
      if (!pool) throw new Error("No pool");
      await pool.query("SELECT 1");
      res.json({ connected: true, type: "MySQL" });
    } catch (err) {
      res.json({ connected: false, message: "MySQL not reachable" });
    }
  });

  app.post("/api/student/profile", async (req, res) => {
    const { name, grade, userId } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });

    try {
      // First check if profile exists for this user
      let [rows]: any = await pool.query("SELECT * FROM students WHERE user_id = ?", [userId]);
      let student = rows.length > 0 ? rows[0] : null;

      if (!student) {
        // Fallback to name/grade check (legacy)
        [rows] = await pool.query("SELECT * FROM students WHERE name = ? AND grade = ?", [name, grade]);
        student = rows.length > 0 ? rows[0] : null;
        
        if (student) {
          // Link existing profile to user
          await pool.query("UPDATE students SET user_id = ? WHERE id = ?", [userId, student.id]);
        } else {
          // Create new linked profile
          const [result]: any = await pool.query("INSERT INTO students (user_id, name, grade) VALUES (?, ?, ?)", [userId, name, grade]);
          const [newRows]: any = await pool.query("SELECT * FROM students WHERE id = ?", [result.insertId]);
          student = newRows[0];
        }
      }

      // Map DB columns to frontend profile format
      const profile = {
        id: student.id,
        name: student.name,
        grade: student.grade,
        totalPoints: student.total_points,
        streak: student.streak,
        level: {
          'Indigenous Languages': student.indigenous_languages_level,
          'Mathematics': student.mathematics_level,
          'Social Science': student.social_science_level,
          'Agriculture, Science and Technology': student.agriculture_science_tech_level,
          'Physical Education': student.physical_education_level,
          'English Language': student.english_language_level
        }
      };
      res.json(profile);
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.put("/api/student/:id/progress", async (req, res) => {
    const { id } = req.params;
    const { level, totalPoints, streak } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });

    try {
      await pool.query(
        `UPDATE students SET 
          indigenous_languages_level = ?, 
          mathematics_level = ?, 
          social_science_level = ?, 
          agriculture_science_tech_level = ?, 
          physical_education_level = ?, 
          english_language_level = ?, 
          total_points = ?, 
          streak = ? 
        WHERE id = ?`,
        [
          level['Indigenous Languages'],
          level['Mathematics'],
          level['Social Science'],
          level['Agriculture, Science and Technology'],
          level['Physical Education'],
          level['English Language'],
          totalPoints,
          streak,
          id
        ]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.get("/api/student/:id/achievements", async (req, res) => {
    const { id } = req.params;
    if (!pool) return res.status(500).json({ error: "No DB" });

    try {
      const [rows]: any = await pool.query("SELECT * FROM achievements WHERE student_id = ?", [id]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.post("/api/student/:id/achievements", async (req, res) => {
    const { id } = req.params;
    const { achievement_id, title, description, icon } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });

    try {
      await pool.query(
        "INSERT INTO achievements (student_id, achievement_id, title, description, icon) VALUES (?, ?, ?, ?, ?)",
        [id, achievement_id, title, description, icon]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.post("/api/student/:id/history", async (req, res) => {
    const { id } = req.params;
    const { subject, correct, total } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });

    try {
      await pool.query(
        "INSERT INTO performance_logs (student_id, subject, correct, total) VALUES (?, ?, ?, ?)",
        [id, subject, correct, total]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  // Resource Management API
  app.get("/api/resources", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "No DB" });
    const { q } = req.query;
    try {
      let query = "SELECT id, title, subject, grade, summary, uploaded_at, LEFT(content, 200) as content FROM resources";
      let params: any[] = [];

      if (q) {
        query += " WHERE title LIKE ? OR content LIKE ? OR subject LIKE ?";
        const searchTerm = `%${q}%`;
        params = [searchTerm, searchTerm, searchTerm];
      }

      query += " ORDER BY uploaded_at DESC";
      
      const [rows]: any = await pool.query(query, params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.get("/api/resources/:id", async (req, res) => {
    const { id } = req.params;
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      const [rows]: any = await pool.query("SELECT * FROM resources WHERE id = ?", [id]);
      if (rows.length === 0) return res.status(404).json({ error: "Resource not found" });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.patch("/api/resources/:id/summary", async (req, res) => {
    const { id } = req.params;
    const { summary } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      await pool.query("UPDATE resources SET summary = ? WHERE id = ?", [summary, id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      if (mimeType === "application/pdf") {
        const data = await pdf(buffer);
        return data.text;
      } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      } else if (mimeType === "text/plain") {
        return buffer.toString("utf-8");
      }
      return "";
    } catch (err) {
      console.error("Extraction Error:", err);
      return "";
    }
  }

  app.post("/api/resources", upload.single("file"), async (req, res) => {
    console.log("POST /api/resources called");
    console.log("Body metadata:", { 
      title: req.body.title, 
      subject: req.body.subject, 
      grade: req.body.grade,
      hasManualContent: !!req.body.content
    });
    console.log("File metadata:", (req as any).file ? {
      name: (req as any).file.originalname,
      mimetype: (req as any).file.mimetype,
      size: (req as any).file.size
    } : "No file");

    const { title, subject, grade, content: manualContent } = req.body;
    if (!pool) return res.status(500).json({ error: "No Database Connection" });

    try {
      let finalContent = manualContent || "";

      if ((req as any).file) {
        const file = (req as any).file;
        console.log(`Processing file: ${file.originalname} (${file.mimetype})`);
        
        try {
          const extracted = await extractTextFromBuffer(file.buffer, file.mimetype);
          if (extracted && extracted.trim().length > 0) {
            finalContent = extracted;
            console.log(`Extraction successful. Length: ${finalContent.length} characters`);
          } else if (!finalContent) {
            console.error("Extraction returned empty content and no manual content provided");
            return res.status(400).json({ error: "Could not extract any readable text from the provided file. Please ensure it's not a scanned image or try copying the text manually." });
          }
        } catch (extractErr: any) {
          console.error("Text extraction failed:", extractErr);
          if (!finalContent) {
            return res.status(400).json({ error: "Failed to process the document: " + extractErr.message });
          }
        }
      }

      if (!finalContent || finalContent.trim().length === 0) {
        return res.status(400).json({ error: "No content was provided. Please upload a file or paste text." });
      }

      const resourceTitle = title || (req as any).file?.originalname || "Untitled Resource";
      const gradeNum = parseInt(grade as string) || 3;
      
      console.log(`Saving to database: ${resourceTitle} for Grade ${gradeNum} - ${subject}`);

      const [result]: any = await pool.query(
        "INSERT INTO resources (title, content, subject, grade) VALUES (?, ?, ?, ?)",
        [resourceTitle, finalContent, subject, gradeNum]
      );
      
      console.log("Resource saved with ID:", result.insertId);
      res.json({ success: true, id: result.insertId });
    } catch (err: any) {
      console.error("Critical Resource Upload Error:", err);
      res.status(500).json({ error: "Internal Server Error during resource storage: " + err.message });
    }
  });

  app.delete("/api/resources/:id", async (req, res) => {
    const { id } = req.params;
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      await pool.query("DELETE FROM resources WHERE id = ?", [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  // Fetch relevant resources for AI context
  app.get("/api/ai/context/:subject/:grade", async (req, res) => {
    const { subject, grade } = req.params;
    if (!pool) return res.status(500).json({ error: "" });
    try {
      const [rows]: any = await pool.query(
        "SELECT content FROM resources WHERE subject = ? AND grade = ? LIMIT 3",
        [subject, grade]
      );
      res.json(rows.map((r: any) => r.content).join("\n\n"));
    } catch (err) {
      res.json("");
    }
  });

  // Teacher Dashboard API
  app.get("/api/teacher/students", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      const [rows]: any = await pool.query("SELECT * FROM students ORDER BY total_points DESC");
      const students = rows.map((student: any) => ({
        id: student.id,
        name: student.name,
        grade: student.grade,
        totalPoints: student.total_points,
        streak: student.streak,
        createdAt: student.created_at,
        level: {
          'Indigenous Languages': student.indigenous_languages_level,
          'Mathematics': student.mathematics_level,
          'Social Science': student.social_science_level,
          'Agriculture, Science and Technology': student.agriculture_science_tech_level,
          'Physical Education': student.physical_education_level,
          'English Language': student.english_language_level
        }
      }));
      res.json(students);
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.get("/api/teacher/logs", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      const [rows]: any = await pool.query(`
        SELECT l.*, s.name as student_name 
        FROM performance_logs l 
        JOIN students s ON l.student_id = s.id 
        ORDER BY l.timestamp DESC 
        LIMIT 500
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.get("/api/teacher/achievements", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      const [rows]: any = await pool.query(`
        SELECT a.*, s.name as student_name 
        FROM achievements a 
        JOIN students s ON a.student_id = s.id 
        ORDER BY a.unlocked_at DESC 
        LIMIT 100
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.post("/api/student/:id/award", async (req, res) => {
    const { id } = req.params;
    const { points, reason } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });

    try {
      await pool.getConnection(); // Check connection
      await pool.query("UPDATE students SET total_points = total_points + ? WHERE id = ?", [points, id]);
      
      // Optionally log this as a performance entry or separate award log
      await pool.query(
        "INSERT INTO performance_logs (student_id, subject, correct, total) VALUES (?, ?, ?, ?)",
        [id, reason || "Bonus Points", points, points]
      );

      res.json({ success: true });
    } catch (err) {
      console.error("Award Error:", err);
      res.status(500).json({ error: "DB Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      details: process.env.NODE_ENV === "development" ? err : undefined
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
