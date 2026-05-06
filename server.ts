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
      if (rows.length > 0) {
        return res.json(rows[0]);
      }

      const [result]: any = await pool.query("INSERT INTO students (name, grade) VALUES (?, ?)", [name, grade]);
      const [newRows]: any = await pool.query("SELECT * FROM students WHERE id = ?", [result.insertId]);
      res.json(newRows[0]);
    } catch (err) {
      res.status(500).json({ error: "DB Error" });
    }
  });

  app.put("/api/student/:id/progress", async (req, res) => {
    const { id } = req.params;
    const { literacy_level, numeracy_level, total_points, streak } = req.body;
    if (!pool) return res.status(500).json({ error: "No DB" });

    try {
      await pool.query(
        "UPDATE students SET literacy_level = ?, numeracy_level = ?, total_points = ?, streak = ? WHERE id = ?",
        [literacy_level, numeracy_level, total_points, streak, id]
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
