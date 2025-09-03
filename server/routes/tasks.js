import express from "express";
import authMiddleware from "../middelwares/authMiddleware.js";

const taskRoutes = (db) => {
  const router = express.Router();

  // CREATE task
  router.post("/", authMiddleware, (req, res) => {
    try {
      const { title, description, dueDate } = req.body;

      if (!title || !description || !dueDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const stmt = db.prepare(
        "INSERT INTO tasks (userId, title, description, dueDate) VALUES (?, ?, ?, ?)"
      );
      const result = stmt.run(req.userId, title, description, dueDate);

      res.json({
        id: result.lastInsertRowid,
        userId: req.userId,
        title,
        description,
        dueDate,
        completed: 0,
      });
    } catch (err) {
      console.error("Error creating task:", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  });

  // READ all tasks for current user
  router.get("/", authMiddleware, (req, res) => {
    try {
      const tasks = db
        .prepare("SELECT * FROM tasks WHERE userId = ?")
        .all(req.userId);

      res.json(tasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  });

  // UPDATE task (supports partial update)
  router.put("/:id", authMiddleware, (req, res) => {
    const { id } = req.params;

    const task = db
      .prepare("SELECT * FROM tasks WHERE id = ? AND userId = ?")
      .get(id, req.userId);

    if (!task) {
      return res.status(404).json({ error: "Task not found or not yours" });
    }

    const updatedTask = {
      ...task, // existing values
      ...req.body, // overwrite with new ones
    };

    db.prepare(
      `UPDATE tasks 
       SET title = ?, description = ?, dueDate = ?, completed = ? 
       WHERE id = ? AND userId = ?`
    ).run(
      updatedTask.title,
      updatedTask.description,
      updatedTask.dueDate,
      updatedTask.completed,
      id,
      req.userId
    );

    res.json({ message: "Task updated", task: updatedTask });
  });

  // DELETE task
  router.delete("/:id", authMiddleware, (req, res) => {
    const { id } = req.params;

    const result = db
      .prepare("DELETE FROM tasks WHERE id = ? AND userId = ?")
      .run(id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Task not found or not yours" });
    }

    res.json({ message: "Task deleted" });
  });

  return router;
};

export default taskRoutes;
