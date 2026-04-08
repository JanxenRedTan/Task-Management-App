const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;
const TASKS_FILE = path.join(__dirname, "tasks.json");

app.use(cors());
app.use(express.json());

// Initialize tasks.json if it doesn't exist
if (!fs.existsSync(TASKS_FILE)) {
  fs.writeFileSync(
    TASKS_FILE,
    JSON.stringify(
      [
        { id: "1", title: "Design landing page", description: "Create wireframes and mockups for the landing page", dueDate: "2024-12-31", priority: "high", status: "todo" },
        { id: "2", title: "Set up database schema", description: "Define tables and relationships for the application", dueDate: null, priority: "medium", status: "in-progress" },
        { id: "3", title: "Write unit tests", description: "Implement comprehensive unit tests for all modules", dueDate: "2024-11-15", priority: "low", status: "done" },
      ],
      null,
      2
    )
  );
}

function readTasks() {
  const data = fs.readFileSync(TASKS_FILE, "utf8");
  return JSON.parse(data);
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

// GET /tasks — retrieve all tasks
app.get("/tasks", (req, res) => {
  const tasks = readTasks();
  res.json(tasks);
});

// POST /tasks — create a new task
app.post("/tasks", (req, res) => {
  const { title, description, dueDate, priority } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }

  const tasks = readTasks();
  const newTask = {
    id: Date.now().toString(),
    title: title.trim(),
    description: description ? description.trim() : "",
    dueDate: dueDate || null,
    priority: priority || "medium",
    status: "todo",
  };

  tasks.push(newTask);
  writeTasks(tasks);
  res.status(201).json(newTask);
});

// PUT /tasks/:id — update task status
app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["todo", "in-progress", "done"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const tasks = readTasks();
  const taskIndex = tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  tasks[taskIndex].status = status;
  writeTasks(tasks);
  res.json(tasks[taskIndex]);
});

// DELETE /tasks/:id — delete a task
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const tasks = readTasks();
  const filtered = tasks.filter((t) => t.id !== id);

  if (filtered.length === tasks.length) {
    return res.status(404).json({ error: "Task not found" });
  }

  writeTasks(filtered);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
