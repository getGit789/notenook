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

  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const userTasks = await db.query.tasks.findMany({
      where: eq(tasks.userId, req.user.id),
      orderBy: tasks.createdAt,
    });

    res.json(userTasks);
  });

  app.post("/api/tasks", upload.single('voiceNote'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const taskData = {
      ...req.body,
      userId: req.user.id,
      voiceNote: req.file?.path,
    };

    const result = insertTaskSchema.safeParse(taskData);
    if (!result.success) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
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

  // Voice note upload endpoint
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

    // Update task with new voice note path
    const [updatedTask] = await db
      .update(tasks)
      .set({
        voiceNote: req.file.path,
        updatedAt: new Date()
      })
      .where(eq(tasks.id, taskId))
      .returning();

    res.json(updatedTask);
  });

  // Serve voice notes statically
  app.use('/uploads/voice-notes', (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    next();
  }, express.static('uploads/voice-notes'));

  const httpServer = createServer(app);
  return httpServer;
}