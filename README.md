# Taskboard — Trello-Style Task Manager

A minimal, full-stack task management app with a React frontend and Node.js/Express backend. Tasks are persisted in a local JSON file.


## 🎥 Demo Video

[![Watch Demo](https://img.youtube.com/vi/BNDc5K88R0E/0.jpg)](https://www.youtube.com/watch?v=BNDc5K88R0E)


## Project Structure

```
trello-app/
├── client/          # React frontend (port 3000)
│   ├── public/
│   └── src/
│       ├── App.js   # Main component (board + columns + cards)
│       ├── App.css  # Styles
│       └── index.js # React entry point
└── server/          # Express backend (port 3001)
    ├── index.js     # API routes + file I/O
    ├── tasks.json   # Auto-created data store
    └── package.json
```

## Getting Started

### 1. Start the Backend

```bash
cd server
npm install
node index.js
# → Server running at http://localhost:3001
```

### 2. Start the Frontend

```bash
cd client
npm install
npm start
# → App opens at http://localhost:3000
```

## REST API

| Method | Endpoint       | Description         |
|--------|----------------|---------------------|
| GET    | /tasks         | Get all tasks       |
| POST   | /tasks         | Create a new task   |
| PUT    | /tasks/:id     | Update task status  |
| DELETE | /tasks/:id     | Delete a task       |

### Example Requests

```bash
# Get all tasks
curl http://localhost:3001/tasks

# Create a task
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Fix login bug"}'

# Move task to in-progress
curl -X PUT http://localhost:3001/tasks/123 \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}'
```

## Task Schema

```json
{
  "id": "1717000000000",
  "title": "Fix login bug",
  "status": "todo"
}
```

Valid statuses: `todo` | `in-progress` | `done`

## Features

- Three-column board: **To Do**, **In Progress**, **Done**
- Add tasks via the header input
- Move tasks forward/backward between columns
- Delete tasks
- Data persists in `server/tasks.json`
