import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: "Username already exists" });
      } else {
        res.status(500).json({ error: "Registration failed" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });

    try {
      const [users]: any = await pool.query(
        "SELECT * FROM users WHERE username = ? AND password = ?",
        [username, password]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = users[0];
      let studentProfile = null;

      if (user.role === 'student') {
        const [students]: any = await pool.query("SELECT * FROM students WHERE user_id = ?", [user.id]);
        if (students.length > 0) {
          const s = students[0];
          studentProfile = {
            id: s.id,
            name: s.name,
            grade: s.grade,
            totalPoints: s.total_points,
            streak: s.streak,
            level: {
              'Indigenous Languages': s.indigenous_languages_level,
              'Mathematics': s.mathematics_level,
              'Social Science': s.social_science_level,
              'Agriculture, Science and Technology': s.agriculture_science_tech_level,
              'Physical Education': s.physical_education_level,
              'English Language': s.english_language_level
            }
          };
        }
      }

      res.json({ 
        user: { id: user.id, username: user.username, role: user.role },
        studentProfile
      });
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // ADMIN API
  app.get("/api/admin/users", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      const [rows]: any = await pool.query("SELECT id, username, role, created_at FROM users");
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
    const { name, grade } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });

    try {
      const [rows]: any = await pool.query("SELECT * FROM students WHERE name = ? AND grade = ?", [name, grade]);
      let student = rows.length > 0 ? rows[0] : null;

      if (!student) {
        const [result]: any = await pool.query("INSERT INTO students (name, grade) VALUES (?, ?)", [name, grade]);
        const [newRows]: any = await pool.query("SELECT * FROM students WHERE id = ?", [result.insertId]);
        student = newRows[0];
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
    try {
      const [rows]: any = await pool.query("SELECT * FROM resources ORDER BY uploaded_at DESC");
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.post("/api/resources", async (req, res) => {
    const { title, content, subject, grade } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });
    try {
      await pool.query(
        "INSERT INTO resources (title, content, subject, grade) VALUES (?, ?, ?, ?)",
        [title, content, subject, grade]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
