import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import taskRoutes from "./routes/tasks.js";
import journalRoutes from "./routes/journals.js";
import streakRoutes from "./routes/streaks.js";
import authRoutes from "./routes/auth.js";
import Database from "better-sqlite3";

dotenv.config();

const app = express();
//middleware
app.use(cors());
app.use(express.json());

//db setup
const db = new Database('amara.db');

//db task tabels
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS tasks(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    dueDate TEXT,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )
  `
).run();
//db journal table
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS journals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    createdAt TEXT DEFAULT (dateTime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
  `
).run();
db.prepare(`
  CREATE TABLE IF NOT EXISTS streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER UNIQUE NOT NULL,
    currentStreak INTEGER DEFAULT 0,
    longestStreak INTEGER DEFAULT 0,
    lastDate TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`).run();


// Ensure we have a row to start tracking (single-user case)
const row = db.prepare("SELECT * FROM streaks WHERE userId = ?").get(req.userId);
if (!row) {
  db.prepare(`
    INSERT INTO streaks (userId, currentStreak, longestStreak, lastDate) 
    VALUES (?, 0, 0, NULL)
  `).run(req.userId);
}




// task routes
app.use("/api/tasks", taskRoutes(db));
app.use('/api/journals', journalRoutes(db));
app.use('/api/streaks', streakRoutes(db));
app.use('/api/auth', authRoutes(db))
//debug route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
