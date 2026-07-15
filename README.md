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

**Infrastructure**
- Docker, with multi-stage builds for both services (the frontend build output is served as static assets through Nginx)
- Docker Compose for local multi-container orchestration
- Kubernetes (Deployments, Services, Ingress, ConfigMaps, and Secrets) for containerized deployment behind an NGINX Ingress Controller

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
│   ├── Dockerfile
│   ├── index.js
│   └── src/
│       ├── middleware/auth/     # JWT cookie verification
│       ├── routes/
│       │   ├── api/             # Credential CRUD endpoints
│       │   └── api/auth/        # Login, signup, GitHub OAuth exchange
│       └── schemas/             # Mongoose models for users and password records
├── frontend/
│   ├── Dockerfile
│   ├── ngnix.conf
│   └── src/
│       ├── components/
│       ├── pages/                # HomePage, SignIn, SignUp, Callback, Dashboard
│       └── App.jsx
├── deployment/
│   ├── passly-namespace.yml
│   ├── ingress.yml
│   ├── backend/                  # Deployment, Service, ConfigMap, Secret
│   └── frontend/                 # Deployment, Service
└── compose.yml
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
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id
```

Run the frontend:

```
npm run dev
```

### GitHub OAuth App configuration

When creating the OAuth App on GitHub, set:

- Homepage URL: `hostname configured in ingress`
- Authorization callback URL: `http://hostname/login/callback`

## Deployment

The repo is configured to run as containerized services, locally with Docker Compose and orchestrated with Kubernetes.

### Docker Compose

The backend builds from a Node 22 Alpine image, and the frontend is built in a Node stage and served as static assets through Nginx in a second stage.

Fill in the environment values in `compose.yml` (GitHub OAuth credentials, MongoDB connection string, JWT key), then run:

```
docker compose up --build
```

The frontend is served at `http://localhost:5173`, and the backend at `http://localhost:3000`.

### Kubernetes

Manifests are provided under `deployment/`, targeting a dedicated `passly` namespace:

- `passly-namespace.yml` — creates the namespace
- `backend/` — Deployment, Service, ConfigMap, and Secret for the backend (5 replicas)
- `frontend/` — Deployment and Service for the frontend (5 replicas)
- `ingress.yml` — routes both services under a single hostname (`passly.local`): `/` goes to the frontend service, and `/api` goes to the backend service

Before applying, rename `configmap.yaml` and `secret.yaml` under `deployment/backend/` to `.yml` and fill in the required values. Add the mapping in `deployment/host_mapping.txt` to your system's hosts file to resolve `passly.local` locally.

Apply the manifests with:

```
kubectl apply -f deployment/
kubectl apply -f deployment/frontend/
kubectl apply -f deployment/backend/
```

Alternatively, `deploy.cmd` (Windows) applies all manifests in this order.

Once applied, the app is reachable at `http://passly.local/`, with the backend served from the same hostname under `http://passly.local/api/`.

This requires a Kubernetes cluster with an NGINX Ingress Controller (for example, via Minikube, kind, or Docker Desktop) and the backend and frontend images built and pushed to a registry the cluster can pull from.

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

## License

No license has been specified for this project.
