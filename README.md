# Fitnexia Admin

Internal administration panel (Fitnexia-only) built with Vite + React.

## Setup

1. Copy env

```bash
cp .env.example .env
```

2. Install and run

```bash
npm install
npm run dev
```

Set `VITE_API_URL` in `.env`:

```env
# Local
VITE_API_URL=http://localhost:3001/v1

# VPS (same URL as mobile `EXPO_PUBLIC_API_URL`)
VITE_API_URL=https://svganchordev.net/fitnexia-api/v1
```

Restart `npm run dev` after changing `.env`.

## Auth

Sign in with an account that has `role=admin` in the backend database (promote via SQL on the VPS Postgres).

