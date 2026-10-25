# Deploy WhereMyApplication on Render

Yes — you can run the full stack on Render: API + web UI on free (or paid) web services, MongoDB Atlas for the database, and Groq for AI. The Chrome extension stays in the browser and points at your Render API URL.

## What runs where

| Piece | Host | Notes |
|-------|------|--------|
| API (`server/`) | Render Web Service | Node 20, Express on `$PORT` |
| Web (`client/`) | Render Web Service | Vite build + `serve.js` static host |
| MongoDB | Atlas (already) | Same `MONGODB_URI` |
| Groq | Groq Cloud | `GROQ_API_KEY` env on API |
| Chrome extension | Chrome Web Store / unpacked | Not hosted on Render; talks to your API |

## 1. Push the project to GitHub

Put the `WhereMyApplication/` folder (or the monorepo root that contains `client/`, `server/`, `render.yaml`) on GitHub.

## 2. Blueprint deploy

1. Open [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect the repo
3. Confirm `render.yaml` creates:
   - `wheremyapplication-api`
   - `wheremyapplication-web`
4. Fill sync:false env vars (below)

### API env (`wheremyapplication-api`)

| Key | Value |
|-----|--------|
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | Long random string |
| `CLIENT_URL` | Hub path OK: `https://YOURDOMAIN/wma` (CORS uses the origin only) |
| `CORS_ORIGINS` | Comma-separated origins, e.g. `https://YOURDOMAIN,https://YOUR-SITE.netlify.app` |
| `CHROME_EXTENSION_IDS` | Required in production — comma-separated extension IDs |
| `GROQ_API_KEY` | From [console.groq.com](https://console.groq.com) |
| `GROQ_MODEL` | `openai/gpt-oss-20b` (or another Groq model you use) |
| `CORS_ALLOW_RENDER` | Leave `false` unless you temporarily need `*.onrender.com` frontends |

### Web env (`wheremyapplication-web`)

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://wheremyapplication-api.onrender.com` (your API URL, no trailing slash) |

Rebuild the web service after setting `VITE_API_URL` (Vite bakes it in at build time).

## 3. Manual deploy (alternative)

**API**

- Root directory: `server`
- Build: `npm install && npm run build`
- Start: `npm start`
- Health check: `/api/health`

**Web**

- Root directory: `client`
- Build: `npm install && npm run build`
- Start: `npm start`

## 4. Point the extension at Render

1. Reload the extension (`chrome://extensions`)
2. Open the side panel → set **API base** to `https://YOUR-API.onrender.com`
3. Set **Web app URL** to `https://YOUR-WEB.onrender.com`
4. Click **Test API connection** → then Sign in
5. Chrome may prompt for host permission the first time — allow it

## 5. Free-tier notes

- Free services spin down after idle; first request can take ~30–60s
- Health check may fail during cold start — wait and retry
- Keep Atlas IP access open to `0.0.0.0/0` (or Render outbound IPs if you restrict)

## Checklist

- [ ] `/api/health` returns `{ ok: true, db: "connected" }`
- [ ] Register/login on the web URL works
- [ ] Extension Test API OK against Render
- [ ] Save a job → appears on Applications
- [ ] Profile resume text set → Resume↔JD match works
- [ ] Kanban drag updates status
