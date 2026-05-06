import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

let pool: mysql.Pool | null = null;

async function checkDatabaseConnection() {
  try {
    const db = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "zim_its",
      port: parseInt(process.env.DB_PORT || "3306"),
      connectTimeout: 5000, // 5 seconds timeout
    });
    const connection = await db.getConnection();
    console.log("✅ Database connected successfully!");
    connection.release();
    pool = db;
  } catch (error) {
    console.error("❌ Database connection failed. Please ensure WAMP/MySQL is running.");
    console.error("Error details:", (error as Error).message);
    // We don't set the pool, so routes will handle the 'no pool' case
  }
}

function getPool() {
  if (!pool) {
    throw new Error("DATABASE_NOT_CONNECTED");
  }
  return pool;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  await checkDatabaseConnection();

  app.use(cors());
  app.use(express.json());

  // --- API ROUTES ---

  // Diagnostic route
  app.get("/api/db-status", (req, res) => {
    res.json({ 
      connected: !!pool,
      config: {
        host: process.env.DB_HOST || "localhost",
        database: process.env.DB_NAME || "zim_its",
        user: process.env.DB_USER || "root"
      }
    });
  });

  // Get or Create Student Profile by Name/Grade
  app.post("/api/student/profile", async (req, res) => {
    const { name, grade } = req.body;
    try {
      const db = getPool();
      // Find existing
      const [rows]: any = await db.execute(
        "SELECT * FROM students WHERE name = ? AND grade = ?",
        [name, grade]
      );

      if (rows.length > 0) {
        return res.json(rows[0]);
      }

      // Create new
      const [result]: any = await db.execute(
        "INSERT INTO students (name, grade) VALUES (?, ?)",
        [name, grade]
      );
      
      const [newStudent]: any = await db.execute(
        "SELECT * FROM students WHERE id = ?",
        [result.insertId]
      );
      res.json(newStudent[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Update Student Progress
  app.put("/api/student/:id/progress", async (req, res) => {
    const { id } = req.params;
    const { literacy_level, numeracy_level, total_points, streak } = req.body;
    const db = getPool();
    try {
      await db.execute(
        "UPDATE students SET literacy_level = ?, numeracy_level = ?, total_points = ?, streak = ? WHERE id = ?",
        [literacy_level, numeracy_level, total_points, streak, id]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Get Student Achievements
  app.get("/api/student/:id/achievements", async (req, res) => {
    const { id } = req.params;
    const db = getPool();
    try {
      const [rows] = await db.execute(
        "SELECT * FROM achievements WHERE student_id = ?",
        [id]
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Save Achievement
  app.post("/api/student/:id/achievements", async (req, res) => {
    const { id } = req.params;
    const { achievement_id, title, description, icon } = req.body;
    const db = getPool();
    try {
      await db.execute(
        "INSERT INTO achievements (student_id, achievement_id, title, description, icon) VALUES (?, ?, ?, ?, ?)",
        [id, achievement_id, title, description, icon]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Get Performance History
  app.get("/api/student/:id/history", async (req, res) => {
    const { id } = req.params;
    const db = getPool();
    try {
      const [rows] = await db.execute(
        "SELECT * FROM performance_logs WHERE student_id = ? ORDER BY timestamp DESC",
        [id]
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Log Performance
  app.post("/api/student/:id/history", async (req, res) => {
    const { id } = req.params;
    const { subject, correct, total } = req.body;
    const db = getPool();
    try {
      await db.execute(
        "INSERT INTO performance_logs (student_id, subject, correct, total) VALUES (?, ?, ?, ?)",
        [id, subject, correct, total]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // --- VITE MIDDLEWARE ---

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
