# Laboratório de Informática

LabFlow is a scheduling system for computer and networking laboratories.

## Project structure

- `backend/api`: NestJS API using Prisma and PostgreSQL.
- `frontend/web`: Next.js web application.
- `docs/api-contract.md`: API endpoint and data contract.

## Run locally

Requirements: Node.js, npm, and PostgreSQL.

### API

1. In `backend/api`, install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and configure the database connection and a
   secure `JWT_SECRET`.
3. Generate the Prisma client with `npx prisma generate`.
4. Start the API with `npm run start:dev`.

The API listens on `http://localhost:3333` by default.

### Frontend

1. In `frontend/web`, install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the API
   URL.
3. Start the web application with `npm run dev`.

The frontend is available at `http://localhost:3000`.

Environment files containing local values are excluded from Git. Do not commit
secrets.
