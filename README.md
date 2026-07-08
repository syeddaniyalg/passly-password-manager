# Passly

Passly is a full-stack password manager built with an Express/MongoDB backend and a React/Vite frontend. It supports both traditional email-and-password accounts and GitHub OAuth sign-in, and stores each saved credential encrypted with a per-user secret key that is never persisted on the server.

## Design

Passly follows a zero-knowledge-adjacent model for stored credentials:

- On account creation, the server generates a random 256-bit secret key and returns it to the user once. The server retains only a bcrypt hash of this key, never the key itself.
- The user is expected to store this key themselves. It is required to decrypt any saved password and cannot be recovered if lost.
- Saved passwords are encrypted with AES-256-GCM using a key derived from the user's secret key via scrypt, with a random initialization vector generated per entry.
- Session state is managed with a short-lived, httpOnly JWT cookie rather than tokens stored in browser storage.

## Tech stack

**Backend**
- Node.js, Express 5
- MongoDB with Mongoose
- bcrypt for password and key hashing
- jsonwebtoken for session cookies
- Node's built-in `crypto` module for AES-256-GCM encryption of stored credentials

**Frontend**
- React 19 with Vite
- React Router
- Zustand for state management
- Tailwind CSS, Headless UI, Framer Motion

## Features

- Email and password authentication
- GitHub OAuth authentication
- Per-entry password strength scoring
- Encrypted credential storage with client-supplied decryption key
- Add, edit, delete, and search saved credentials
- Sorting by title or last modified date

## Project structure

```
passly-password-manager/
├── backend/
│   ├── index.js
│   └── src/
│       ├── middleware/auth/     # JWT cookie verification
│       ├── routes/
│       │   ├── api/             # Credential CRUD endpoints
│       │   └── api/auth/        # Login, signup, GitHub OAuth exchange
│       └── schemas/             # Mongoose models for users and password records
└── frontend/
    └── src/
        ├── components/
        ├── pages/                # HomePage, SignIn, SignUp, Callback, Dashboard
        └── App.jsx
```

## Getting started

### Prerequisites

- Node.js 18 or later
- A MongoDB instance (local or a hosted cluster such as MongoDB Atlas)
- A GitHub OAuth App (for GitHub sign-in), created under GitHub Settings → Developer settings → OAuth Apps

### Backend setup

```
cd backend
npm install
```

Create a `.env` file in `backend/` with the following variables:

```
PORT=5000
MONGODB_URL=your_mongodb_connection_string
JWT_KEY=a_long_random_string
FRONTEND_URL=http://localhost:5173
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
NODE_ENV=development
```

Run the backend:

```
npm run dev
```

### Frontend setup

```
cd frontend
npm install
```

Create a `.env` file in `frontend/` with the following variables:

```
VITE_SERVER_URL=http://localhost:5000
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id
```

Run the frontend:

```
npm run dev
```

The app will be available at `http://localhost:5173`, with the backend running at `http://localhost:5000`.

### GitHub OAuth App configuration

When creating the OAuth App on GitHub, set:

- Homepage URL: `http://localhost:5173`
- Authorization callback URL: `http://localhost:5173/login/callback`

Update these to the deployed frontend URL if hosting the app elsewhere.

## API overview

All credential and account endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth` | Authenticates via email/password or GitHub OAuth code, sets session cookie |
| POST | `/api/signup` | Creates a new account, returns the generated secret key |
| POST | `/api/validate` | Checks whether a username is already taken |
| POST | `/api/getname` | Returns the authenticated user's display name |
| POST | `/api/verify_auth` | Verifies the current session cookie |
| POST | `/api/getlist` | Returns all saved credentials for the authenticated user |
| POST | `/api/additem` | Adds a new encrypted credential |
| POST | `/api/update-item` | Updates an existing credential |
| POST | `/api/deleteItem` | Deletes a credential |
| POST | `/api/validatekey` | Verifies a submitted secret key against its stored hash |
| POST | `/api/decrypt-key` | Decrypts a stored credential using the submitted secret key |

All routes other than `/api/auth`, `/api/signup`, and `/api/validate` require a valid session cookie.

## Status

This project is not currently deployed. It is intended as a learning project covering authentication (including OAuth), REST API design, MongoDB schema modeling, and applied encryption, and is run locally as described above.

## License

No license has been specified for this project.
