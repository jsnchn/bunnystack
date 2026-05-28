# Bunnystack

A Bun-powered multi-domain monorepo starter template.

## Stack

| Domain | Tech |
|---|---|
| **Runtime** | Bun |
| **Monorepo** | Turborepo |
| **Backend** | ElysiaJS |
| **Frontend** | React + Vite |
| **Mobile** | React Native _(coming soon)_ |
| **Desktop** | Electron _(coming soon)_ |
| **Database** | PostgreSQL + Drizzle ORM |
| **Auth** | Better-Auth |
| **Deploy** | Fly.io |

## Getting Started

```bash
bun install
bun run dev
```

## Structure

```
bunnystack/
├── apps/
│   ├── api/          # ElysiaJS backend
│   ├── web/          # React + Vite frontend
│   ├── mobile/       # React Native app
│   └── desktop/      # Electron app
├── packages/
│   ├── db/           # Drizzle ORM + PostgreSQL
│   ├── auth/         # Better-Auth
│   └── config/       # Shared configs & env
└── turbo.json        # Turborepo config
```
