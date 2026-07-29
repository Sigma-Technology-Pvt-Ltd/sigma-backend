# Sigma Backend — API Server

Node.js + Express + Prisma backend for Sigma Technologies website.

## Tech Stack
- **Runtime**: Node.js (ESM modules)
- **Framework**: Express.js
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Storage**: Supabase Storage (images & documents)
- **Deploy**: Render

---

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment
```bash
cp .env.example .env
# Fill in all values in .env
```

### 3. Generate Prisma client
```bash
npx prisma generate
```

### 4. Run dev server
```bash
npm run dev
```

Server runs on `http://localhost:3000`

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Secret key for admin JWT tokens |
| `API_KEY` | API key for frontend requests |
| `APP_URL` | This server's public URL |
| `FRONTEND_URL` | Frontend website URL (for CORS) |
| `ADMIN_URL` | Admin panel URL (for CORS) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (NOT anon key) |
| `SUPABASE_BUCKET` | Supabase storage bucket name (e.g. `sigma-media`) |

---

## Render Deployment

### Service Settings
| Setting | Value |
|---------|-------|
| **Environment** | Node |
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `npm start` |
| **Node Version** | 18+ |

### Steps
1. Push code to GitHub
2. Render → New Web Service → Connect GitHub repo
3. Set Build & Start commands (above)
4. Add all Environment Variables in Render dashboard
5. Deploy ✅

---

## Supabase Storage Setup

1. Supabase Dashboard → Storage → New Bucket
2. Name: `sigma-media`, Public: **ON**
3. Run migration script to upload existing images:
```bash
node scripts/migrateImagesToSupabase.js
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/admin/login` | Admin login |
| `GET` | `/api/admin/products` | List products |
| `POST` | `/api/admin/products` | Create product |
| `PUT` | `/api/admin/products/:id` | Update product |
| `DELETE` | `/api/admin/products/:id` | Delete product |
| `POST` | `/api/admin/cleanup/search` | Search test data |
| `POST` | `/api/admin/cleanup/delete` | Delete test data |
| ...and more | | |
