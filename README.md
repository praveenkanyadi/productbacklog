# Extra Duty Management (EDM)

Standalone Extra Duty Management app for employee-initiated extra duty requests with multi-step approvals. Uses Temporal for workflow orchestration, PostgreSQL for state, and Next.js for the UI.

## Stack

| Layer   | Tech           |
|---------|----------------|
| Frontend| Next.js, React, Tailwind, shadcn/ui |
| API     | Node.js, Express |
| Workflows | Temporal |
| Database| PostgreSQL, Prisma |

## Run Locally

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### 1. Install

```bash
npm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

### 3. Reset database & seed

```bash
export DATABASE_URL="postgresql://edm:edm@localhost:5432/edm"
npm run demo:reset
```

### 4. Start apps (3 terminals)

```bash
# Terminal 1
DATABASE_URL="postgresql://edm:edm@localhost:5432/edm" npm run dev:api

# Terminal 2
DATABASE_URL="postgresql://edm:edm@localhost:5432/edm" npm run dev:worker

# Terminal 3
npm run dev:web
```

- Web: http://localhost:3000  
- API: http://localhost:3001  
- Temporal UI: http://localhost:8080  

## Demo

See **[docs/DEMO.md](docs/DEMO.md)** for a step-by-step demo script.

Quick flow: open assignments → create + submit request (as employee) → switch to approver → approve → view timeline → check audit/notifications.

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/DEMO.md](docs/DEMO.md) | Demo script and checklist |
| [docs/DEMO-TALK-TRACK.md](docs/DEMO-TALK-TRACK.md) | Demo talk track for internal stakeholders |
| [docs/POSITIONING.md](docs/POSITIONING.md) | Product positioning and strategy |
| [docs/WHY-THIS-MATTERS.md](docs/WHY-THIS-MATTERS.md) | Product and AI strategy rationale |
| [docs/NEXT-STEPS.md](docs/NEXT-STEPS.md) | Roadmap and extension options |
| [docs/LOCAL-RUN.md](docs/LOCAL-RUN.md) | Dev setup, env, verification endpoints |
| [docs/edm-spec.md](docs/edm-spec.md) | Product spec and architecture |

## Project Structure

```
├── apps/
│   ├── web/       # Next.js frontend
│   ├── api/       # Express API
│   └── worker/    # Temporal worker
├── packages/
│   └── shared/    # Prisma, shared types
└── docs/
```
