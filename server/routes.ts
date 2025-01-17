import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { tasks, insertTaskSchema } from "@db/schema";
import { eq } from "drizzle-orm";
import express from 'express';

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

    await db.delete(tasks).where(eq(tasks.id, taskId));
    res.status(200).send("Task deleted");
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