# MERN Blog

A simple blog platform built with MongoDB, Express, React and Node.js. It has JWT authentication (access + refresh tokens), Google/Facebook login, role-based access control, posts with soft delete, comments, an admin panel, and real-time notifications using Socket.io.

```
assign/
├── backend/    Express REST API (Node.js, MongoDB/Mongoose)
└── frontend/   React app (Vite)
```

## Tech Stack

| Layer    | Tools |
| -------- | ----- |
| Backend  | Node.js, Express 4, Mongoose 8, JWT (`jsonwebtoken`), `bcryptjs`, Joi, Passport (Google + Facebook OAuth 2.0), `express-rate-limit`, Socket.io |
| Frontend | React 18 (functional components + hooks), React Router 6, Context API, Axios, `socket.io-client` |
| Testing  | Jest, Supertest, `mongodb-memory-server` |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in the values (see below)
npm run create-admin      # creates the first admin user from ADMIN_* values in .env
npm run dev               # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev               # http://localhost:5173
```

### 3. Tests

```bash
cd backend
npm test                  # or: npm run test:coverage
```

Tests use an in-memory MongoDB (`mongodb-memory-server`), so no running database is needed. The first run downloads a MongoDB binary, which can take a minute.

## Environment Setup

### `backend/.env`

| Variable | Description |
| -------- | ----------- |
| `NODE_ENV` | `development` / `production` |
| `PORT` | API port (default `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `CLIENT_URL` | Frontend URL - used for CORS, OAuth redirects and Socket.io |
| `SERVER_URL` | Backend URL - used to build OAuth callback URLs |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Two different long random strings |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes (default `15m` / `7d`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials (optional) |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook OAuth credentials (optional) |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used only by `npm run create-admin` |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### `frontend/.env`

| Variable | Description |
| -------- | ----------- |
| `VITE_API_URL` | API base URL, e.g. `http://localhost:5000/api/v1` |
| `VITE_SOCKET_URL` | Socket.io server URL, e.g. `http://localhost:5000` |

### Setting up social login (optional)

A provider is only enabled when both of its credentials are set. Without them, the app still works and the social login buttons return a "not configured" response.

- **Google** - In Google Cloud Console create an OAuth 2.0 Client ID (Web application) and add `http://localhost:5000/api/v1/auth/google/callback` as an authorized redirect URI.
- **Facebook** - In Meta for Developers create an app with Facebook Login and add `http://localhost:5000/api/v1/auth/facebook/callback` as a valid OAuth redirect URI. The `email` permission is required.

## Features

### Authentication

- Register / login / logout with email and password. Passwords are hashed with bcrypt (`bcryptjs`) in a Mongoose `pre('save')` hook.
- Registering only creates the account; tokens are issued at login (the user is redirected to the login page after signing up).
- **Access token** (15 min) is returned in the response body and kept **in memory** on the frontend.
- **Refresh token** (7 days) is set as an **httpOnly cookie** (scoped to `/api/v1/auth`). Only a SHA-256 hash of it is stored in the database.
- **Refresh token rotation** - every `/auth/refresh` call issues a new pair and invalidates the old token. Logout revokes it.
- Axios interceptor automatically refreshes an expired access token and retries the request once.
- **Google and Facebook login** via Passport (OAuth 2.0). After a successful login the backend sets the refresh cookie and redirects to `/oauth/success`; the React app then restores the session through `/auth/refresh`. A social account is linked to an existing user with the same email.
- **Rate limiting** on auth routes - 10 requests / 15 min for login and register, 100 / 15 min for the rest of `/auth`.

### Roles and permissions (RBAC)

- Two roles: `user` and `admin`. New accounts are always `user` (a `role` field sent on register is stripped by validation).
- `authenticate` middleware verifies the JWT and loads the user, so deactivating a user or changing their role applies immediately.
- `authorize('admin')` middleware protects all `/admin` routes.
- Ownership checks (`assertOwnerOrAdmin`) in the service layer: users can only edit/delete their own posts and comments; admins can manage everything.
- The frontend hides actions the user can't perform, but every rule is enforced by the API.

### Posts

- Full CRUD with title, content, author and timestamps.
- Unique, URL-friendly slug generated from the title (`my-post`, `my-post-1`, ...). The slug is regenerated when the title changes.
- **Soft delete** - posts get `isDeleted: true` and `deletedAt`. They are hidden from public endpoints but admins can view and restore them.
- Payload validation with Joi.

### Comments

- Logged-in users can comment on posts. Comments reference the post and author via Mongoose `ObjectId` refs, and the post model has a `commentCount` virtual populated from the comments collection.
- Users can edit/delete their own comments; admins can manage all comments.

### Admin panel

Available at `/admin` (admin role only):

- **Dashboard** - total users, posts and comments, plus a recent activity feed.
- **Users** - search, change role, activate/deactivate, delete (their posts are soft deleted, their comments removed). Admins can't change or delete their own account.
- **Posts** - filter by active/deleted, edit, delete, restore.

### Activity logging

`logActivity(action)` middleware writes to the `activitylogs` collection after a successful response - e.g. `login`, `register`, `logout`, `post:create`, `post:delete`, `comment:create`, admin actions.

### Real-time notifications (bonus)

When someone comments on your post, you get a toast notification instantly. The Socket.io connection is authenticated with the access token and each user joins a private room (`user:<id>`).

### Performance

- Indexes: `Post { isDeleted, createdAt }`, `Post { author, isDeleted, createdAt }`, unique `slug`, `Comment { post, createdAt }`, unique `email`, sparse unique `googleId` / `facebookId`.
- All list endpoints are paginated (`page`, `limit` - max 50) and run the `find` and `countDocuments` queries in parallel.
- `populate` only selects the fields that are displayed (e.g. author `name avatar`), and list queries use `.lean()`.

## API Overview

Base URL: `/api/v1`

### Response format

```json
// Success
{ "success": true, "message": "Post created", "data": { ... }, "meta": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 } }

// Error
{ "success": false, "error": { "message": "Validation failed", "details": [{ "field": "title", "message": "title is required" }] } }
```

`message` and `meta` are only included when relevant. All errors go through one centralized error handler (`middleware/errorHandler.js`), which also converts Mongoose cast errors (400), duplicate keys (409) and validation errors (400).

### Auth - `/auth`

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| POST | `/auth/register` | Public | `{ name, email, password }` → creates the account (no tokens - the user logs in next) |
| POST | `/auth/login` | Public | `{ email, password }` → user + access token, sets refresh cookie |
| POST | `/auth/refresh` | Refresh cookie | New access token (rotates the refresh token) |
| POST | `/auth/logout` | Refresh cookie | Revokes the refresh token and clears the cookie |
| GET | `/auth/me` | User | Current user |
| GET | `/auth/google`, `/auth/google/callback` | Public | Google OAuth flow |
| GET | `/auth/facebook`, `/auth/facebook/callback` | Public | Facebook OAuth flow |

### Posts - `/posts`

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | `/posts?page=&limit=&author=` | Public | Paginated list of non-deleted posts |
| GET | `/posts/:slug` | Public | Single post with `commentCount` |
| POST | `/posts` | User | `{ title, content }` |
| PATCH | `/posts/:id` | Owner / Admin | `{ title?, content? }` |
| DELETE | `/posts/:id` | Owner / Admin | Soft delete |

### Comments

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | `/posts/:postId/comments?page=&limit=` | Public | Paginated comments for a post |
| POST | `/posts/:postId/comments` | User | `{ content }` |
| PATCH | `/comments/:id` | Owner / Admin | `{ content }` |
| DELETE | `/comments/:id` | Owner / Admin | Delete a comment |

### Admin - `/admin` (admin only)

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/admin/stats` | `{ totalUsers, totalPosts, totalComments }` |
| GET | `/admin/activity` | Latest 20 activity log entries |
| GET | `/admin/users?page=&limit=&search=` | Paginated users |
| PATCH | `/admin/users/:id` | `{ role?, isActive? }` |
| DELETE | `/admin/users/:id` | Delete a user |
| GET | `/admin/posts?page=&limit=&status=all\|active\|deleted` | All posts incl. deleted |
| PATCH | `/admin/posts/:id/restore` | Restore a soft-deleted post |

### Status codes used

`200` OK, `201` Created, `400` Validation / bad input, `401` Not authenticated / invalid token, `403` Forbidden (role or ownership), `404` Not found, `409` Duplicate, `429` Too many requests, `501` OAuth provider not configured, `500` Server error.

## Project Structure

```
backend/
├── src/
│   ├── app.js                 Express app (middleware + routes)
│   ├── server.js              Entry point: DB connection, HTTP server, Socket.io
│   ├── socket.js              Socket.io setup + notifyUser()
│   ├── config/                db.js, passport.js (OAuth strategies)
│   ├── models/                User, Post, Comment, ActivityLog
│   ├── validators/            Joi schemas
│   ├── middleware/            authenticate, authorize, validate, rateLimiter, activityLogger, errorHandler
│   ├── services/              Business logic (auth, token, post, comment, user, admin)
│   ├── controllers/           Thin HTTP layer - read request, call service, send response
│   ├── routes/v1/             Express routers grouped by resource
│   ├── utils/                 ApiError, asyncHandler, apiResponse, pagination, permissions
│   └── scripts/createAdmin.js
└── tests/
    ├── unit/                  token service, middleware, slug generation, permissions
    └── integration/           auth, posts, comments, admin (Supertest)

frontend/src/
├── api/client.js              Axios instance, token handling, refresh interceptor
├── context/AuthContext.jsx    Global auth state
├── components/                Layout, Navbar, ProtectedRoute, AdminLayout, PostList, CommentSection, Pagination, Notifications
├── pages/                     Home, Login, Register, OAuthSuccess, PostDetail, PostEditor, MyPosts, NotFound
│   └── admin/                 AdminDashboard, AdminUsers, AdminPosts
└── utils/format.js
```

**Request flow:** `route → middleware (authenticate / authorize / validate / logActivity) → controller → service → model`. Controllers don't contain business logic; services don't know about `req`/`res`.

## Assumptions

- One active session per user: logging in again (or on another device) replaces the stored refresh token.
- Posts are plain text (no rich text editor or image uploads).
- The first admin is created with `npm run create-admin`; after that admins can promote other users from the admin panel.
- Deleting a user is a hard delete; their posts are soft deleted and their comments removed.
- Comments are hard deleted. Comments on a soft-deleted post are kept, so they come back if the post is restored.
- In production the frontend and API are expected to run over HTTPS, so the refresh cookie uses `secure` + `sameSite=none`.
