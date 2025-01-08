import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { tasks, insertTaskSchema } from "@db/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from 'express';

// Configure multer for voice note uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/voice-notes';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'voice-note-' + uniqueSuffix + '.wav');
  }
});

const upload = multer({ storage: storage });

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Serve voice notes statically with proper headers
  app.use('/uploads/voice-notes', (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    // Set proper MIME type for audio files
    res.set({
      'Accept-Ranges': 'bytes',
      'Content-Type': 'audio/wav',
    });

    next();
  }, express.static(path.join(process.cwd(), 'uploads/voice-notes'), {
    setHeaders: (res, filePath) => {
      res.set('Content-Type', 'audio/wav');
    }
  }));

  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const userTasks = await db.query.tasks.findMany({
      where: eq(tasks.userId, req.user.id),
      orderBy: tasks.createdAt,
    });

    // Transform voice note paths to full URLs
    const tasksWithFullUrls = userTasks.map(task => ({
      ...task,
      voiceNote: task.voiceNote ? `/uploads/voice-notes/${path.basename(task.voiceNote)}` : null
    }));

    res.json(tasksWithFullUrls);
  });

  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const result = insertTaskSchema.safeParse({ ...req.body, userId: req.user.id });
    if (!result.success) {
      return res.status(400).send("Invalid input");
    }

    const task = await db.insert(tasks).values(result.data).returning();
    res.json(task[0]);
  });

  app.put("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const taskId = parseInt(req.params.id);
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task || task.userId !== req.user.id) {
      return res.status(404).send("Task not found");
    }

    const result = insertTaskSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).send("Invalid input");
    }

    const [updatedTask] = await db
      .update(tasks)
      .set({ ...result.data, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning();

    res.json(updatedTask);
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const taskId = parseInt(req.params.id);
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task || task.userId !== req.user.id) {
      return res.status(404).send("Task not found");
    }

    // Delete associated voice note if it exists
    if (task.voiceNote) {
      const voiceNotePath = path.join(process.cwd(), task.voiceNote);
      if (fs.existsSync(voiceNotePath)) {
        fs.unlinkSync(voiceNotePath);
      }
    }

    await db.delete(tasks).where(eq(tasks.id, taskId));
    res.status(200).send("Task deleted");
  });

  app.post("/api/tasks/:id/voice-note", upload.single('voiceNote'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    if (!req.file) {
      return res.status(400).send("No voice note provided");
    }

    const taskId = parseInt(req.params.id);
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task || task.userId !== req.user.id) {
      // Delete uploaded file if task validation fails
      fs.unlinkSync(req.file.path);
      return res.status(404).send("Task not found");
    }

    // Delete old voice note if it exists
    if (task.voiceNote) {
      const oldVoiceNotePath = path.join(process.cwd(), task.voiceNote);
      if (fs.existsSync(oldVoiceNotePath)) {
        fs.unlinkSync(oldVoiceNotePath);
      }
    }

    // Store only the filename in the database
    const voiceNotePath = path.relative(process.cwd(), req.file.path);

    // Update task with new voice note path
    const [updatedTask] = await db
      .update(tasks)
      .set({
        voiceNote: voiceNotePath,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId))
      .returning();

    // Return the full URL for the voice note
    res.json({
      ...updatedTask,
      voiceNote: `/uploads/voice-notes/${path.basename(voiceNotePath)}`
    });
  });

  app.post("/api/tasks/reorder", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { taskIds } = req.body;
    if (!Array.isArray(taskIds)) {
      return res.status(400).send("Invalid input: taskIds must be an array");
    }

    try {
      // Update task positions using a transaction
      const updatedTasks = await db.transaction(async (tx) => {
        const updates = taskIds.map((taskId, index) =>
          tx
            .update(tasks)
            .set({ position: index })
            .where(eq(tasks.id, taskId))
            .returning()
        );
        return Promise.all(updates);
      });

      res.json(updatedTasks.flat());
    } catch (error) {
      console.error("Error reordering tasks:", error);
      res.status(500).send("Failed to reorder tasks");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}