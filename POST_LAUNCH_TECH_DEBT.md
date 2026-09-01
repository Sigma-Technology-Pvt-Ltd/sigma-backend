# Post-Launch Technical Debt & Infrastructure Dependencies

## Critical Keep-Alive Dependency: Render & Supabase Free Tiers

### Overview
The Sigma Technologies backend is hosted on **Render (Free Tier)** and its database is hosted on **Supabase PostgreSQL (Free Tier)**.

Both free tiers enforce automatic dormancy policies:
1. **Render Free Tier**: Spins down the web service into a sleep state after **15 minutes** of inactivity. The next incoming request incurs a **30 to 50 second cold-start delay**.
2. **Supabase Free Tier**: Automatically **pauses the entire PostgreSQL database after 7 consecutive days of inactivity** (no active queries). When paused, any backend connection attempts will fail immediately with connection errors (`ENOTFOUND tenant/user not found` or `Can't reach database server`), taking down all public APIs, the admin panel, and ClaimDesk ticketing.

---

### Solution: Live Database Health Check Endpoint

A dedicated health check endpoint is implemented in `server.js`:
- **Endpoint**: `GET /health` (also aliased at `GET /api/health`)
- **Authentication**: None required (open for public uptime pingers)
- **Action**: Runs a lightweight, direct SQL query (`SELECT NOW() as db_time, 1 as active`) against Supabase via Prisma.
- **Responses**:
  - **`HTTP 200 OK`**: Database is active and reachable. Returns JSON payload with `status: "healthy"`, `latency_ms`, and real Postgres timestamp `db_time`.
  - **`HTTP 503 Service Unavailable`**: Database is unreachable or paused. Returns JSON payload with error details to trigger monitor alerts immediately.

---

### External Monitoring Setup (UptimeRobot)

To prevent both Render from sleeping and Supabase from auto-pausing, an external monitor must be configured:

| Setting | Value |
| :--- | :--- |
| **Monitor Type** | HTTP(s) |
| **Friendly Name** | `Sigma Backend & DB Keep-Alive` |
| **URL** | `https://sigma-backend-s4pg.onrender.com/health` |
| **Monitoring Interval** | **5 minutes** (Every 5 mins) |
| **HTTP Method** | `GET` |
| **Expected Response** | `200 OK` |

> **Why 5 minutes?**  
> A 5-minute interval comfortably stays within Render's 15-minute inactivity window (keeping the Node instance warm) and ensures regular query activity against Supabase (defeating the 7-day auto-pause trigger).

---

### ⚠️ Warning & Failure Modes

> **CRITICAL DEPENDENCY**:
> If the UptimeRobot monitor is ever **disabled, deleted, paused, or pointed to the wrong URL**:
> 1. Render will resume sleeping after 15 minutes of user inactivity.
> 2. Supabase will silently **pause the PostgreSQL database after 7 days** without queries.
> 3. Once paused, the backend will fail to connect on start or request handling, crashing API responses (`HTTP 500 / 503`) across the frontend, admin panel, and ClaimDesk until manually unpaused in the Supabase Dashboard.
