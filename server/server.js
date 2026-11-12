
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("node:dns");

require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const dnsServers = process.env.MONGODB_DNS_SERVERS
  ?.split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (dnsServers?.length) {
  dns.setServers(dnsServers);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Define Task Schema
const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Ongoing", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Create Task Model
const Task = mongoose.model("Task", TaskSchema);

// GET: Fetch all tasks
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({
      message: "Could not fetch tasks.",
    });
  }
});

// POST: Create a new task
app.post("/tasks", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required.",
      });
    }

    const newTask = new Task({ title: title.trim() });
    const savedTask = await newTask.save();

    res.status(201).json(savedTask);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(400).json({
      message: "Could not create task.",
    });
  }
});

// PATCH: Update task status
app.patch("/tasks/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["Pending", "Ongoing", "Completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid task status.",
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    res.json(updatedTask);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({
      message: "Could not update task status.",
    });
  }
});

// DELETE: Delete a task
app.delete("/tasks/:id", async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(
      req.params.id
    );

    if (!deletedTask) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    res.json({ message: "Task deleted successfully." });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({
      message: "Could not delete task.",
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set. Add it to server/.env.");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected successfully");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);

  const serverErrors = error.cause?.servers || error.reason?.servers;
  if (serverErrors instanceof Map) {
    for (const [address, server] of serverErrors) {
      const cause = server.error;
      console.error(
        `MongoDB node ${address}: ${
          cause
            ? `${cause.name}${cause.code ? ` (${cause.code})` : ""}: ${cause.message}`
            : server.type
        }`
      );
    }
  }

  process.exitCode = 1;
});
