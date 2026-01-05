# API Documentation

## Base URL

```
Development: http://localhost:5000/api
Production: <your-deployed-backend-url>/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained through the `/auth/login` or `/auth/register` endpoints.

---

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `201 Created`
```json
{
  "_id": "64abc123...",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login User

**POST** `/auth/login`

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "_id": "64abc123...",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User

**GET** `/auth/me`

Get currently authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "_id": "64abc123...",
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

## Notes Endpoints

### Get All Notes

**GET** `/notes`

Retrieve all notes for the authenticated user.

**Query Parameters:**
- `search` (optional): Full-text search query
- `tag` (optional): Filter by specific tag

**Response:** `200 OK`
```json
[
  {
    "_id": "64note123...",
    "user": "64abc123...",
    "title": "Meeting Notes",
    "content": "Discussed project timeline and deliverables...",
    "aiSummary": "Team meeting about project scope and deadlines",
    "aiActionItems": [
      "Schedule follow-up meeting",
      "Review project documentation"
    ],
    "aiTags": ["meeting", "project", "planning"],
    "isPinned": false,
    "color": "#ffffff",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### Get Single Note

**GET** `/notes/:id`

Retrieve a specific note by ID.

**Response:** `200 OK` (same structure as individual note above)

### Create Note

**POST** `/notes`

Create a new note with AI-generated summary and tags.

**Request Body:**
```json
{
  "title": "My Important Note",
  "content": "This is the content of my note...",
  "color": "#fef3c7"
}
```

**Response:** `201 Created` (same structure as note object)

### Update Note

**PUT** `/notes/:id`

Update an existing note. If content changes, AI summary is regenerated.

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "color": "#bfdbfe",
  "isPinned": true
}
```

**Response:** `200 OK` (updated note object)

### Delete Note

**DELETE** `/notes/:id`

Delete a note.

**Response:** `200 OK`
```json
{
  "message": "Note removed"
}
```

### Rewrite Note with AI

**POST** `/notes/:id/rewrite`

Rewrite note content using AI in different styles.

**Request Body:**
```json
{
  "style": "polish"  // Options: "polish", "bullets", "shorten"
}
```

**Response:** `200 OK`
```json
{
  "rewrittenContent": "The AI-rewritten content..."
}
```

### Regenerate AI Tags

**POST** `/notes/:id/regenerate-tags`

Generate new AI tags for a note.

**Response:** `200 OK` (updated note with new tags)

---

## Tasks Endpoints

### Get All Tasks

**GET** `/tasks`

Retrieve all tasks for the authenticated user.

**Query Parameters:**
- `category` (optional): Filter by category (Work, Study, Personal)
- `status` (optional): Filter by status (todo, in-progress, completed)
- `completed` (optional): Filter by completion status (true/false)

**Response:** `200 OK`
```json
[
  {
    "_id": "64task123...",
    "user": "64abc123...",
    "title": "Complete project proposal",
    "description": "Write and submit the Q1 project proposal",
    "category": "Work",
    "status": "in-progress",
    "priority": "high",
    "dueDate": "2024-01-20T00:00:00.000Z",
    "aiPriorityScore": {
      "impact": "high",
      "effort": "medium",
      "urgency": "high",
      "reasoning": "High priority due to upcoming deadline..."
    },
    "aiFocusMode": {
      "steps": [
        "Research similar proposals",
        "Draft outline",
        "Write first draft",
        "Review and refine"
      ],
      "motivationTip": "Break it into small steps and tackle one at a time!",
      "estimatedEffort": "2-3 hours"
    },
    "completed": false,
    "createdAt": "2024-01-10T09:00:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  }
]
```

### Get Task Statistics

**GET** `/tasks/stats`

Get aggregated statistics about user's tasks.

**Response:** `200 OK`
```json
{
  "total": 15,
  "completed": 8,
  "pending": 7,
  "byCategory": {
    "Work": 6,
    "Study": 5,
    "Personal": 4
  },
  "byPriority": {
    "high": 3,
    "medium": 8,
    "low": 4
  }
}
```

### Get Single Task

**GET** `/tasks/:id`

Retrieve a specific task by ID.

**Response:** `200 OK` (same structure as individual task above)

### Create Task

**POST** `/tasks`

Create a new task.

**Request Body:**
```json
{
  "title": "Write blog post",
  "description": "Write a technical blog post about React hooks",
  "category": "Personal",
  "priority": "medium",
  "dueDate": "2024-01-25"
}
```

**Response:** `201 Created` (task object)

### Update Task

**PUT** `/tasks/:id`

Update an existing task.

**Request Body:** (all fields optional)
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "category": "Work",
  "priority": "high",
  "dueDate": "2024-01-30",
  "status": "in-progress",
  "completed": false
}
```

**Response:** `200 OK` (updated task object)

### Delete Task

**DELETE** `/tasks/:id`

Delete a task.

**Response:** `200 OK`
```json
{
  "message": "Task removed"
}
```

### Toggle Task Completion

**PATCH** `/tasks/:id/toggle`

Toggle the completion status of a task.

**Response:** `200 OK` (updated task object)

### Generate AI Priority Score

**POST** `/tasks/:id/ai-priority`

Generate AI-powered priority analysis for a task.

**Response:** `200 OK` (task with aiPriorityScore populated)

### Generate AI Focus Mode

**POST** `/tasks/:id/focus-mode`

Generate AI-powered focus mode breakdown for a task.

**Response:** `200 OK` (task with aiFocusMode populated)

---

## AI Assistant Endpoints

### Chat with AI Assistant

**POST** `/assistant/chat`

Send a message to the AI assistant and get a context-aware response.

**Request Body:**
```json
{
  "message": "How can I improve my productivity?"
}
```

**Response:** `200 OK`
```json
{
  "response": "Based on your current tasks, I recommend..."
}
```

### Get Weekly Summary

**GET** `/assistant/weekly-summary`

Get an AI-generated summary of productivity for the past week.

**Response:** `200 OK`
```json
{
  "summary": "This week you completed 8 tasks across Work and Personal categories. You've been particularly productive with... Consider focusing on..."
}
```

### Get Priority Suggestions

**GET** `/assistant/suggest-priorities`

Get AI recommendations on which tasks to prioritize.

**Response:** `200 OK`
```json
{
  "suggestions": "I recommend prioritizing 'Complete project proposal' due to its approaching deadline and high impact. After that, focus on..."
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "message": "Not authorized, no token" 
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error"
}
```

---

## Rate Limiting

The AI-powered endpoints (summary generation, rewriting, priority scoring, focus mode, assistant chat) may be subject to OpenAI API rate limits. Consider implementing appropriate rate limiting on the client side.

## Best Practices

1. **Token Management**: Store JWT tokens securely in localStorage
2. **Error Handling**: Always handle potential errors from API calls
3. **Loading States**: Show loading indicators during AI operations
4. **Optimistic Updates**: Update UI optimistically before server confirmation for better UX
5. **Debouncing**: Debounce search inputs to reduce unnecessary API calls

---

## WebSocket Support

Currently not implemented, but future versions may include WebSocket support for real-time updates.

## Versioning

Current API Version: `v1` (implicit in base URL)

Future versions will use explicit versioning: `/api/v2/...`
