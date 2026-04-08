import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import "./App.css";

const API = "http://localhost:3001";

const COLUMNS = [
  {
    id: "todo",
    label: "To Do",
    accent: "var(--todo)",
    bg: "var(--todo-bg)",
    border: "var(--todo-border)",
    next: "in-progress",
    nextLabel: "Start →",
  },
  {
    id: "in-progress",
    label: "In Progress",
    accent: "var(--inprogress)",
    bg: "var(--inprogress-bg)",
    border: "var(--inprogress-border)",
    next: "done",
    nextLabel: "Complete →",
    prev: "todo",
    prevLabel: "← Back",
  },
  {
    id: "done",
    label: "Done",
    accent: "var(--done)",
    bg: "var(--done-bg)",
    border: "var(--done-border)",
    prev: "in-progress",
    prevLabel: "← Reopen",
  },
];

function TaskCard({ task, onDelete, onViewDetails }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card ${isDragging ? "card--dragging" : ""}`}
    >
      <div
        className="card__content"
        {...attributes}
        {...listeners}
      >
        <button 
          className="card__title-button"
          onClick={() => onViewDetails(task)}
          type="button"
        >
          {task.title}
        </button>
      </div>
      <div className="card__actions">
        <button
          className="btn btn--danger btn--sm btn--icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          title="Delete task"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function Column({ column, tasks, onDelete, onViewDetails }) {
  const taskIds = tasks.map(task => task.id);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`column ${isOver ? "column--over" : ""}`}
      style={{
        "--col-accent": column.accent,
        "--col-bg": column.bg,
        "--col-border": column.border,
      }}
    >
      <div className="column__header">
        <div className="column__dot" />
        <h2 className="column__title">{column.label}</h2>
        <span className="column__count">{tasks.length}</span>
      </div>
      <div className="column__body">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="column__empty">No tasks here</div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/tasks`);
      setTasks(res.data);
      setError(null);
    } catch {
      setError("Cannot connect to server. Make sure it's running on port 3001.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await axios.post(`${API}/tasks`, {
        title: newTitle.trim(),
        description: newDescription.trim(),
        dueDate: newDueDate || null,
        priority: newPriority,
      });
      setTasks((prev) => [...prev, res.data]);
      setNewTitle("");
      setNewDescription("");
      setNewDueDate("");
      setNewPriority("medium");
      setShowAddModal(false);
    } catch {
      setError("Failed to add task.");
    } finally {
      setAdding(false);
    }
  };

  const handleMove = async (id, status) => {
    try {
      const res = await axios.put(`${API}/tasks/${id}`, { status });
      setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    } catch {
      setError("Failed to update task.");
    }
  };

  const handleDelete = (id) => {
    const task = tasks.find(t => t.id === id);
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await axios.delete(`${API}/tasks/${taskToDelete.id}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch {
      setError("Failed to delete task.");
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the active task
    const activeTask = tasks.find(task => task.id === activeId);
    if (!activeTask) return;

    // Determine the new status based on the drop target
    let newStatus;
    if (overId === 'todo' || overId === 'in-progress' || overId === 'done') {
      newStatus = overId;
    } else {
      // Dropped on another task, use that task's status
      const overTask = tasks.find(task => task.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      } else {
        return;
      }
    }

    // Only update if status changed
    if (activeTask.status !== newStatus) {
      handleMove(activeId, newStatus);
    }

    setActiveId(null);
  };

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  const activeTask = activeId ? tasks.find(task => task.id === activeId) : null;

  return (
    <div className="app">
      <header className="header">
        <div className="header__inner">
          <div className="header__brand">
            <span className="header__logo">▦</span>
            <h1 className="header__title">Taskboard</h1>
          </div>
          <button
            className="btn btn--add"
            onClick={() => setShowAddModal(true)}
          >
            + Add Task
          </button>
        </div>
      </header>

      {error && (
        <div className="error-bar">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Add New Task</h2>
              <button className="modal__close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form className="add-form" onSubmit={handleAdd}>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  className="add-form__input"
                  type="text"
                  placeholder="New task title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="add-form__textarea"
                  placeholder="Task description (optional)..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div className="form-group">
                <label htmlFor="dueDate">Due Date</label>
                <input
                  id="dueDate"
                  className="add-form__input"
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  className="add-form__select"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn--add"
                  type="submit"
                  disabled={adding || !newTitle.trim()}
                >
                  {adding ? "Adding…" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && taskToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal modal--small" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Delete Task</h2>
              <button className="modal__close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal__body">
              <p>Are you sure you want to delete the task <strong>"{taskToDelete.title}"</strong>?</p>
              <p className="modal__warning">This action cannot be undone.</p>
            </div>
            <div className="modal__actions">
              <button
                type="button"
                className="btn btn--cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn--danger"
                onClick={confirmDelete}
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Task Details</h2>
              <button className="modal__close" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>
            <div className="modal__body">
              <div className="task-details">
                <div className="task-detail">
                  <strong>Title:</strong> {selectedTask.title}
                </div>
                <div className="task-detail">
                  <strong>Description:</strong> {selectedTask.description || "No description"}
                </div>
                <div className="task-detail">
                  <strong>Due Date:</strong> {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "No due date"}
                </div>
                <div className="task-detail">
                  <strong>Priority:</strong> 
                  <span className={`priority priority--${selectedTask.priority || 'medium'}`}>
                    {selectedTask.priority ? selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1) : 'Medium'}
                  </span>
                </div>
                <div className="task-detail">
                  <strong>Status:</strong> {selectedTask.status ? selectedTask.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Todo'}
                </div>
              </div>
            </div>
            <div className="modal__actions">
              <button
                type="button"
                className="btn btn--cancel"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="board">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {loading ? (
            <div className="loading">
              <span className="loading__spinner" />
              Loading tasks…
            </div>
          ) : (
            COLUMNS.map((col) => (
              <Column
                key={col.id}
                column={col}
                tasks={getTasksByStatus(col.id)}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
              />
            ))
          )}
          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
}
