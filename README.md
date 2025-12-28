# Passwordy - Self-Hosted Password Vault

Passwordy is a secure, production-quality, self-hosted password vault built with **FastAPI** (Backend), **React** (Frontend), and **PostgreSQL** (Database). It features a futuristic black/purple theme with glassmorphism and modern encryption.

## Features

- **Encryption at Rest**: Vault passwords are encrypted using **AES-256-GCM** with per-record nonces. Keys are derived per-user using **HKDF** from a master vault key.
- **Secure Authentication**: Password hashing with **Argon2** and session management via **HttpOnly JWT cookies**.
- **Futuristic UI**: A premium dark theme with purple neon accents, responsive grid cards, and smooth animations.
- **Copy-to-Clipboard**: Quickly copy passwords with feedback.
- **Password Generator**: Secure password generation built into the entry creation flow.
- **Docker-First**: Deploys entirely with Docker Compose including health checks and auto-migrations.

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy 2.0 (Async), Alembic, Pydantic v2, Cryptography.
- **Frontend**: React + TypeScript (Vite), TailwindCSS, Framer Motion, Lucide Icons.
- **Database**: PostgreSQL 15.

## Quick Start

1. **Clone the repository**
2. **Setup environment variables**:
   ```bash
   cp .env.example .env
   ```
   *Note: Update `VAULT_MASTER_KEY` and `SECRET_KEY` for production.*
3. **Launch the application**:
   ```bash
   docker compose up --build
   ```
4. **Access the vault**:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Initial Login: `admin` / `changeme` (Configurable in `.env`)

## Security Model

### Authentication
User passwords are hashed using **Argon2** (via `passlib`). On login, a JWT is issued and stored in an **HttpOnly, SameSite=Lax** cookie to prevent XSS-based token theft.

### Vault Encryption
Passwords stored in the vault are never stored in plaintext. 
1. A **Master Key** is provided via environment variables.
2. For each user, a **User Key** is derived using HKDF-SHA256 with the `user_id` as information.
3. Passwords are encrypted using **AES-GCM**, providing both confidentiality and integrity (AEAD).
4. Each record stores its own unique 12-byte **nonce**.

## Development

### Running Migrations
Migrations run automatically on container startup. To create a new migration manually:
```bash
docker compose exec backend alembic revision --autogenerate -m "description"
```

### Backend Tests
```bash
docker compose exec backend pytest
```

## License
MIT
