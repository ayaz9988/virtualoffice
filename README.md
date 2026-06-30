# Virtual Office

A full-stack web application for virtual office hours and classroom sessions, integrating Zoom for video meetings.

## Features

- **Teacher role**: Create/manage rooms, view waiting queue, admit or decline students
- **Student role**: Browse open rooms, join waiting queue, get admitted to Zoom sessions
- **Zoom integration**: Automatic meeting creation, SDK signature generation, and join URL handling
- **Real-time updates**: Server-Sent Events (SSE) for instant queue and status updates
- **Zoom waiting room**: Students wait in Zoom's built-in waiting room until the host lets them in
- **Dark/Light theme**: Toggle between dark and light modes with persistent preference
- **Magenta accent**: Custom magenta color palette across all interactive elements
- **Loading states**: Spinner animations on all API-calling buttons for better UX

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 18, Vite, Chakra UI v3, Zustand, React Router |
| Backend  | Express.js, SQLite (better-sqlite3), JWT auth, SSE, express-validator |
| Video    | Zoom Meetings SDK, Zoom API                    |

## Project Structure

```
virtualoffice/
  frontend/           # React SPA (Vite)
    src/
      hooks/
        useColorMode.js  # Dark/light theme hook with localStorage persistence
      pages/
      store/
      theme.js           # Chakra UI theme config (magenta accent tokens)
  backend/            # Express API server (SQLite)
    routes/
      events.js       # SSE endpoint
      rooms.js        # Room CRUD + student join
      waiting.js      # Admit/decline students
    services/
      sse.js          # SSE connection manager
      zoom.js         # Zoom API integration
    middleware/
      auth.js         # JWT authentication (header or query param)
      validate.js     # Request input validation (express-validator)
```

## Getting Started

### Prerequisites

- Node.js 18+
- Zoom API credentials (Account ID, Client ID, Client Secret, SDK Key, SDK Secret)

### Install Dependencies

```bash
npm run install:all
```

### Environment Variables

Create `backend/.env`:

```
JWT_SECRET=your-secret
PORT=4000
ZOOM_ACCOUNT_ID=your-account-id
ZOOM_CLIENT_ID=your-client-id
ZOOM_CLIENT_SECRET=your-client-secret
ZOOM_SDK_KEY=your-sdk-key
ZOOM_SDK_SECRET=your-sdk-secret
ZOOM_SECRET_TOKEN=your-secret-token
```

### Development

```bash
npm run dev
```

Runs both backend (port 4000) and frontend (Vite dev server) concurrently.

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

Starts the backend server. Serve the frontend from `frontend/dist/` or configure the backend to serve static files.

## Architecture

### Input Validation

All endpoint inputs are validated using **express-validator** middleware:

- **Auth** — `POST /register` (name, email format, password min 6, role enum), `POST /login` (email, password)
- **Rooms** — `PATCH /:id` (room ID, topic enum, is_open 0/1), `POST /:id/wait` (note max 500 chars), `GET /:id/waiting` (room ID)
- **Waiting** — `PATCH /:id/admit`, `PATCH /:id/decline` (entry ID), `GET /mine` (room_id required)
- **Zoom** — `GET /signature` (meetingNumber int, role 0/1)

Validation rules are centralized in `middleware/validate.js` and return `400` with the first error message on failure.

### Real-time via SSE

The app uses **Server-Sent Events** instead of polling for real-time updates:

- `GET /api/events` — SSE endpoint authenticated via JWT query param (`?token=...`)
- **Events emitted:**
  - `waiting-queue-changed` → teacher when a student joins/leaves the queue
  - `status-changed` → student when admitted or declined
- **Connection manager** (`services/sse.js`) tracks connected clients by user ID
- Frontend subscribes with native `EventSource` API — auto-reconnects on disconnect

### Zoom Waiting Room

Meetings are created with `waiting_room: true` and `join_before_host: false`. This means:

1. All admitted students get the same Zoom link
2. They are held in Zoom's waiting room until the host lets them in one by one
3. The teacher controls the flow inside the Zoom meeting itself
