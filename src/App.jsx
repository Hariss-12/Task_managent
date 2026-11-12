
import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

const API_URL = "http://localhost:5000/tasks";

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Show feedback messages temporarily
  const showSuccess = (message) => {
    setSuccess(message);
    setError(null);

    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  // Fetch all tasks from the backend
  const fetchTasks = async () => {
    try {
      const response = await axios.get(API_URL);
      setTasks(response.data);
      setError(null);
    } catch (err) {
      setError("Could not fetch tasks. Check your backend and MongoDB.");
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Create a new task
  const createTask = async () => {
    if (!title.trim()) {
      setError("Task title cannot be empty.");
      setSuccess(null);
      return;
    }

    try {
      const response = await axios.post(API_URL, {
        title: title.trim(),
      });

      setTasks((prevTasks) => [...prevTasks, response.data]);
      setTitle("");
      showSuccess("Task created successfully!");
    } catch (err) {
      setError("Could not create task.");
      setSuccess(null);
      console.error("Create error:", err);
    }
  };

  // Update task status
  const updateTaskStatus = async (id, newStatus) => {
    try {
      const response = await axios.patch(`${API_URL}/${id}`, {
        status: newStatus,
      });

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === id ? response.data : task
        )
      );

      showSuccess("Task status updated successfully!");
    } catch (err) {
      setError("Could not update task status.");
      setSuccess(null);
      console.error("Update error:", err);
    }
  };

  // Delete a task
  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);

      setTasks((prevTasks) =>
        prevTasks.filter((task) => task._id !== id)
      );

      showSuccess("Task deleted successfully!");
    } catch (err) {
      setError("Could not delete task.");
      setSuccess(null);
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center">Task Manager</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      {/* Add Task Input */}
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") createTask();
          }}
          placeholder="Enter task title"
          aria-label="Task title"
        />

        <button
          className="btn btn-primary"
          onClick={createTask}
          type="button"
        >
          Add Task
        </button>
      </div>

      {/* Task Categories */}
      <div className="row">
        {["Pending", "Ongoing", "Completed"].map((status) => {
          const filteredTasks = tasks.filter(
            (task) => task.status === status
          );

          return (
            <div className="col-md-4" key={status}>
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">{status} Tasks</h5>
                </div>

                <div className="card-body">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onUpdateStatus={updateTaskStatus}
                      onDelete={deleteTask}
                    />
                  ))}

                  {filteredTasks.length === 0 && (
                    <p className="text-muted">
                      No tasks in this category.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Individual Task Card Component
const TaskCard = ({ task, onUpdateStatus, onDelete }) => {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <h6 className="card-title">{task.title}</h6>

        <p className="card-text">
          Status: {task.status}
        </p>

        <div className="d-flex flex-wrap gap-2">
          {task.status !== "Pending" && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onUpdateStatus(task._id, "Pending")}
              type="button"
            >
              Mark Pending
            </button>
          )}

          {task.status !== "Ongoing" && (
            <button
              className="btn btn-info btn-sm"
              onClick={() => onUpdateStatus(task._id, "Ongoing")}
              type="button"
            >
              Mark Ongoing
            </button>
          )}

          {task.status !== "Completed" && (
            <button
              className="btn btn-success btn-sm"
              onClick={() => onUpdateStatus(task._id, "Completed")}
              type="button"
            >
              Complete
            </button>
          )}

          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(task._id)}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
