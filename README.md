# LLM Studio — Inference Logging & Ingestion System

A production-grade LLM chatbot with multi-provider support, real-time inference logging, event-based ingestion pipeline, PII redaction, and observability dashboards.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Setup Instructions](#setup-instructions)
3. [API Reference](#api-reference)
4. [Schema Design Decisions](#schema-design-decisions)
5. [Tradeoffs Made](#tradeoffs-made)
6. [What I Would Improve With More Time](#what-i-would-improve-with-more-time)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│              React + Vite (port 3000)                       │
│   Chat UI · Conversation List · Dashboard (Recharts)        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / SSE (streaming)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express API (port 5000)                   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  /api/conv.. │  │  /api/logs   │  │ /api/dashboard   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
│         │                 │                                 │
│         ▼                 ▼                                 │
│  ┌─────────────────────────────────┐                        │
│  │       LLM SDK Wrapper           │                        │
│  │  llmClient.js                   │                        │
│  │  · captures metadata            │                        │
│  │  · measures latency             │                        │
│  │  · handles errors               │                        │
│  └──────┬──────────────────────────┘                        │
│         │                                                   │
│    ┌────┴──────┐   ┌──────────┐   ┌──────────┐             │
│    │  OpenAI   │   │  Groq    │   │OpenRouter│  ...        │
│    └───────────┘   └──────────┘   └──────────┘             │
└─────────────────────────┬───────────────────────────────────┘
                          │ enqueueLog()
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Ingestion Pipeline                             │
│                                                             │
│   Redis available?                                          │
│   ├── YES → Bull Queue (async, 3 retries, exp. backoff)     │
│   └── NO  → Direct DB write (fallback)                      │
│                    │                                        │
│                    ▼  PII Redaction                         │
│             [EMAIL] [PHONE] [SSN] [CARD] [IP] [NAME]        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     MongoDB Atlas                           │
│                                                             │
│   conversations        inferencelogs                        │
│   ─────────────        ─────────────                        │
│   sessionId            sessionId                            │
│   title                requestId                            │
│   provider             provider / model                     │
│   model                latencyMs                            │
│   messages[]           promptTokens                         │
│   status               completionTokens                     │
│   timestamps           totalTokens                          │
│                        status / errorMessage                │
│                        inputPreview (PII-redacted)          │
│                        outputPreview (PII-redacted)         │
│                        timestamp                            │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

- **SDK wraps all LLM calls** — no provider is called directly from routes. All metadata capture, error handling, and logging happens in one place (`sdk/llmClient.js`)
- **Event-based ingestion** — logs are pushed to a Redis/Bull queue and processed asynchronously, so LLM response latency is never blocked by DB writes
- **Graceful degradation** — if Redis is down, the system falls back to direct DB writes automatically with no code changes needed
- **SSE streaming** — responses stream token-by-token to the frontend using Server-Sent Events, with usage stats captured from the final stream chunk

---

## Setup Instructions

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for one-command setup)
- API keys for at least one provider

### Option 1 — Docker Compose (Recommended)

```bash
# 1. Clone and enter the project
git clone <repo-url> && cd ai_chatbot

# 2. Copy env file and fill in your API keys
cp .env.example .env

# 3. Start everything (Redis + Backend + Frontend)
docker compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:5000
# Health   → http://localhost:5000/health
```

### Option 2 — Local Development

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start backend
cd backend
npm install
# Create .env with your keys (see .env.example)
npm start

# Terminal 3: Start frontend
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/ai_chatbot

# Redis (optional — falls back to direct writes if unavailable)
REDIS_URL=redis://localhost:6379

# LLM Providers (add keys for providers you want to use)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
DEEPSEEK_API_KEY=sk-...
GROK_API_KEY=xai-...
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-v1-...

# Config
MAX_CONTEXT_MESSAGES=10
```

### Kubernetes (Self-Hosted)

```bash
# 1. Build images
docker build -t ai-chatbot-backend:latest ./backend
docker build -t ai-chatbot-frontend:latest ./frontend

# 2. Update secrets
# Edit k8s/00-namespace-secrets.yaml with your API keys and MongoDB URI

# 3. Apply all manifests
kubectl apply -f k8s/

# 4. Add to /etc/hosts
echo "127.0.0.1 chatbot.local" | sudo tee -a /etc/hosts

# App → http://chatbot.local
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/providers` | List available providers and models |
| POST | `/api/conversations` | Create a new conversation |
| GET | `/api/conversations` | List all conversations |
| GET | `/api/conversations/:id` | Get conversation with full message history |
| PATCH | `/api/conversations/:id/cancel` | Cancel a conversation |
| POST | `/api/conversations/:id/messages` | Send message — returns SSE stream |
| POST | `/api/conversations/:id/save` | Persist messages after stream completes |
| POST | `/api/logs/ingest` | External log ingestion endpoint |
| GET | `/api/logs` | Query inference logs (filter by provider, sessionId) |
| GET | `/api/dashboard/stats` | Aggregated dashboard statistics |
| GET | `/api/dashboard/prometheus` | Prometheus-compatible metrics scrape endpoint |

---

## Schema Design Decisions

### `conversations` collection

```js
{
  sessionId: String,       // UUID, primary lookup key
  title: String,           // auto-set from first user message
  provider: String,        // groq | openrouter | openai | ...
  model: String,           // exact model string used
  messages: [{             // embedded array — fast reads, no joins
    role: String,          // user | assistant | system
    content: String,
    timestamp: Date,
  }],
  status: String,          // active | cancelled | completed
  createdAt: Date,
  updatedAt: Date,
}
```

**Why embed messages instead of a separate collection?**
Conversations are always read and written together. Embedding avoids a join on every message fetch and keeps the data model simple. The tradeoff is document size — mitigated by the 10-message context window keeping active conversations lean.

### `inferencelogs` collection

```js
{
  sessionId: String,       // links log to conversation
  requestId: String,       // UUID per request, unique index
  provider: String,
  model: String,
  inputPreview: String,    // first 200 chars, PII-redacted
  outputPreview: String,   // first 200 chars, PII-redacted
  promptTokens: Number,
  completionTokens: Number,
  totalTokens: Number,
  latencyMs: Number,
  status: String,          // success | error | cancelled
  errorMessage: String,
  timestamp: Date,
  metadata: Mixed,         // extensible for future fields
}
```

**Indexes:**
- `sessionId` — filter logs by conversation
- `timestamp DESC` — dashboard time-range queries
- `provider + timestamp DESC` — per-provider breakdown queries
- `requestId` unique — deduplication

**Why separate from conversations?**
Inference logs are append-only, high-volume, and queried differently (aggregations, time ranges, provider filters). Keeping them separate avoids bloating conversation documents and allows independent scaling and retention policies.

---

## Tradeoffs Made

| Decision | Tradeoff |
|----------|----------|
| **Embedded messages in conversation** | Fast reads but document grows with history. Acceptable because context is capped at 10 messages sent to LLM |
| **Bull + Redis for ingestion** | Adds operational complexity (Redis dependency) but gives async processing, retries, and backpressure. Falls back to direct writes if Redis is unavailable |
| **SSE over WebSockets** | Simpler to implement and sufficient for unidirectional streaming. WebSockets would be needed for bidirectional features |
| **MongoDB Atlas free tier** | No `$percentile` operator support — replaced with in-memory sort-based percentile calculation in aggregation pipeline |
| **PII redaction via regex** | Fast and zero-dependency but heuristic — will miss novel PII patterns. A proper NLP-based redaction library would be more accurate |
| **Short context window (10 msgs)** | Keeps token costs low and avoids provider context limits. Full history is still stored in DB and window is configurable |
| **Input/output previews (200 chars)** | Balances observability with storage cost. Full content is never logged — only previews after PII redaction |
| **Single Express process** | Simple to deploy and debug. For production, the ingestion worker should be a separate process to isolate failure domains |

---

## What I Would Improve With More Time

### Reliability
- **Separate ingestion worker process** — run the Bull queue consumer as its own service so a crash in the API doesn't affect log processing
- **Dead letter queue** — failed log jobs currently get dropped after 3 retries. A DLQ would allow inspection and replay
- **Idempotent ingestion** — the `requestId` unique index prevents duplicate logs but the API doesn't return a meaningful error on duplicate submission

### Observability
- **Grafana dashboard** — wire the Prometheus endpoint (`/api/dashboard/prometheus`) to a Grafana instance with pre-built panels for latency histograms, error rates, and token burn rate
- **Distributed tracing** — add OpenTelemetry spans across the request lifecycle (API → SDK → provider → queue → DB)
- **Log retention policy** — TTL index on `inferencelogs` to auto-expire old logs and control storage costs

### Features
- **Streaming token counting** — currently tokens are captured from the final stream chunk. Some providers don't return usage in streams at all — a local tokenizer (tiktoken) would give accurate counts regardless of provider
- **Conversation search** — full-text search across message history using MongoDB Atlas Search
- **Rate limiting** — per-session or per-IP rate limiting on the chat endpoint to prevent abuse
- **Auth** — JWT-based authentication so multiple users can have isolated conversation histories
- **Model fallback** — if the primary provider fails, automatically retry with a fallback provider

### Infrastructure
- **Horizontal scaling** — the backend is stateless and can scale horizontally behind a load balancer. The Bull queue already supports multiple concurrent workers
- **Redis Cluster** — single Redis node is a SPOF. Redis Sentinel or Cluster for HA
- **CDN for frontend** — serve the React build from CloudFront or similar instead of Nginx
- **CI/CD pipeline** — GitHub Actions to run tests, build Docker images, and push to a registry on merge to main
