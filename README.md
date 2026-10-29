# MergePilot 🤖

[![Live Demo](https://img.shields.io/badge/Live_Demo-merge--pilot--lime.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://merge-pilot-lime.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> 🚀 **Live Demo:** [https://merge-pilot-lime.vercel.app](https://merge-pilot-lime.vercel.app)

**AI-powered code review platform that automatically reviews your pull requests using RAG (Retrieval-Augmented Generation) and Google Gemini.**

MergePilot connects to your GitHub repositories, indexes your entire codebase into a vector database, and generates detailed AI code reviews whenever a pull request is opened — right inside GitHub as a comment.

---

## Features

- **GitHub OAuth** — Sign in with GitHub, granting repo access
- **Repository Management** — Connect any of your GitHub repositories with one click
- **Codebase Indexing** — Automatically indexes your repo's files into Pinecone vector DB using Gemini embeddings when you connect a repository
- **AI Code Reviews** — When a PR is opened or updated, MergePilot fetches the diff, retrieves relevant context from the indexed codebase, and generates a detailed review using Gemini 2.5 Flash
- **GitHub PR Comments** — Posts the AI review directly as a comment on the PR
- **Review History** — All generated reviews are stored and viewable in the dashboard
- **Contribution Graph** — Visualizes your GitHub contribution activity for the past year
- **Dashboard Stats** — Shows total repos, commits, PRs, and AI reviews at a glance
- **Subscription Tiers** — Free tier (5 repos, 5 reviews/repo) and Pro tier (unlimited) via Polar payments
- **Theme Toggle** — Light/dark mode support
- **Profile Settings** — Update your name and email

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Auth | Better Auth + GitHub OAuth + Polar plugin |
| Database | PostgreSQL (Neon) via Prisma v7 |
| Background Jobs | Inngest |
| Vector DB | Pinecone |
| AI | Google Gemini 2.5 Flash (reviews) + Gemini Embedding 001 (indexing) |
| Payments | Polar (sandbox) |
| Webhooks | GitHub Webhooks + ngrok (local dev) |

---

## How It Works

```
User connects repo
       ↓
GitHub webhook registered
       ↓
Inngest triggers codebase indexing
       ↓
Files → Gemini Embeddings → Pinecone
       ↓
PR opened on GitHub
       ↓
GitHub webhook → MergePilot
       ↓
Fetch PR diff + retrieve context from Pinecone
       ↓
Gemini 2.5 Flash generates review
       ↓
Review posted as GitHub PR comment
       ↓
Review saved to database
```

---

## Getting Started

### Prerequisites

- Node.js 20+ or Bun
- PostgreSQL database (Neon recommended)
- GitHub OAuth App
- Google AI Studio API key
- Pinecone account
- Polar account (sandbox for dev)
- ngrok (for local webhook testing)

### Environment Variables

Create a `.env` file in the root:

```env
DATABASE_URL=your_postgresql_connection_string

BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

NEXT_PUBLIC_APP_BASE_URL=https://your-ngrok-url.ngrok-free.dev

GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key

PINECONE_DB_API_KEY=your_pinecone_api_key

POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
POLAR_SUCCESS_URL=http://localhost:3000/dashboard/subscription?success=true

INNGEST_DEV=1
```

### Installation

```bash
# Install dependencies
bun install

# Run database migrations
bunx prisma migrate dev

# Start the development server
bun dev

# Start Inngest dev server (separate terminal)
npx inngest-cli@latest dev

# Start ngrok tunnel (separate terminal)
ngrok http 3000
```

### GitHub OAuth App Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
2. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`
3. Copy the Client ID and Secret to your `.env`

### Pinecone Setup

1. Create a Pinecone index named `merge-pilot-vector-embeddings`
2. Set dimensions to `768` (Gemini embedding-001 output)
3. Copy the API key to your `.env`

---

## Project Structure

```
mergepilot/
├── app/                        # Next.js App Router pages
│   ├── (auth)/login/           # Login page
│   ├── dashboard/              # Dashboard, repository, reviews, subscription, settings
│   └── api/
│       ├── auth/               # Better Auth routes
│       ├── inngest/            # Inngest webhook handler
│       └── webhooks/github/    # GitHub webhook handler
├── components/                 # Shared UI components
│   ├── app-sidebar.tsx         # Dashboard sidebar with nav + user info
│   └── ui/                     # shadcn/ui components
├── inngest/
│   ├── client.ts               # Inngest client
│   └── functions/
│       ├── index.ts            # Repository indexing function
│       └── review.ts           # AI review generation function
├── lib/
│   ├── auth.ts                 # Better Auth config with Polar plugin
│   ├── auth-client.ts          # Client-side auth utilities
│   ├── db.ts                   # Prisma client singleton
│   └── pinecone.ts             # Pinecone client
├── module/
│   ├── ai/lib/rag.ts           # Embedding generation + Pinecone indexing/retrieval
│   ├── dashboard/              # Dashboard stats and contribution graph
│   ├── github/lib/github.ts    # GitHub API utilities (Octokit)
│   ├── payment/                # Subscription management + Polar integration
│   ├── repository/             # Repository connect/disconnect logic
│   ├── review/                 # Review fetching
│   └── settings/               # Profile + connected repos management
└── prisma/
    └── schema.prisma           # Database schema
```

---

## License

MIT
