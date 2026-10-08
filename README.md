# WhereMyApplication

Private, login-based job application tracker (React + Express + MongoDB) with a Chrome extension to capture LinkedIn / Indeed / Naukri / career-page jobs.

**Start here for day-to-day use:** [HOW_TO_TRACK.md](./HOW_TO_TRACK.md)

Gmail auto-sync is **not** included. Update application status yourself in the web app.

## Features

- Email/password auth (JWT) — each user only sees their own applications
- Applications CRUD, status pipeline, timeline, notes, **duplicate detection**
- **Kanban board** by status (drag to update)
- **Resume ↔ JD match score** (Groq) — paste resume text on Profile
- **Salary insights** from your saved JDs + links to Levels.fyi / Glassdoor / etc.
- Dashboard: status counts, improvement tips, where-to-apply links, follow-ups
- Chrome MV3 **side panel** (stays open): scrape job pages, **Easy Apply auto-capture**
- CSV export

## Project layout

```
WhereMyApplication/
  client/          # React + Vite web app
  server/          # Express + MongoDB API
  extension/       # Chrome extension (side panel)
  HOW_TO_TRACK.md  # Day-to-day tracking
  DEPLOY.md        # Deploy API + web on Render
  PUBLISH_EXTENSION.md  # Chrome Web Store publish
  README.md
```

## Quick start

### 1. MongoDB

`server/.env` is already set to your MongoDB Atlas cluster and database `WhereMyApplication`.

### 2. Install & run

```bash
cd WhereMyApplication
npm run install:all
npm run dev
```

| Service | URL |
|---------|-----|
| Web | http://localhost:5173 |
| API | http://127.0.0.1:5080 |

### 3. Chrome extension

1. `chrome://extensions` → Developer mode → **Load unpacked**
2. Select `WhereMyApplication/extension`
3. Click the toolbar icon — the **side panel** opens and stays open until you close it
4. Sign in; API base `http://127.0.0.1:5080`
5. On a job page → **Save this job** (or complete LinkedIn Easy Apply for auto-save)

## Env vars

**Server (`server/.env`)** — do not commit real passwords

```
PORT=5080
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.rsp6hto.mongodb.net/WhereMyApplication?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=change-me-to-a-long-random-string
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
```

**Client (`client/.env`)**

```
VITE_API_URL=
```

(Empty in local dev — Vite proxies `/api` to port 5080. For production set the full API URL.)

> Note: Do **not** use port **5060** — Chrome blocks it (`ERR_UNSAFE_PORT`).

## Deploy (Render)

**Yes — deploy API + web on Render.** Step-by-step: [DEPLOY.md](./DEPLOY.md).  
Publish the extension for anyone: [PUBLISH_EXTENSION.md](./PUBLISH_EXTENSION.md).

Blueprint: `render.yaml`. Set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `GROQ_API_KEY`, and `VITE_API_URL`.

## API overview

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | no |
| POST | `/api/auth/login` | no |
| GET | `/api/auth/me` | yes |
| POST | `/api/auth/change-password` | yes |
| CRUD | `/api/applications` | yes |
| POST | `/api/applications/:id/enrich` | yes |
| POST | `/api/applications/:id/match` | yes |
| PATCH | `/api/applications/:id/status` | yes |
| GET | `/api/applications/:id/timeline` | yes |
| GET | `/api/applications/export.csv` | yes |
| GET | `/api/applications/follow-ups` | yes |
| GET | `/api/dashboard/stats` | yes |
| GET/PUT | `/api/profile` | yes |
| GET | `/api/profile/insights` | yes |

## Groq AI enrichment (optional but recommended)

1. Get an API key from [console.groq.com](https://console.groq.com)
2. Add to `server/.env`:
   ```
   GROQ_API_KEY=your_key_here
   GROQ_MODEL=openai/gpt-oss-20b
   ```
3. Restart the API (`npm run dev`)
4. Reload the Chrome extension (**v1.5.0**)
5. On a job page click **Save this job** — full page text is sent; Groq fills missing fields
6. Paste resume text on **Profile**, then open an application → **Resume↔JD match**
7. On any application detail page you can also click **AI enrich**

Without `GROQ_API_KEY`, captures still save scraped fields; AI enrichment / match are skipped.
