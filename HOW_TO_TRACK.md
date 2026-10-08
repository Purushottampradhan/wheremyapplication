# How to track job applications with WhereMyApplication

This guide covers everything you need to do day to day. **Gmail auto-sync is not included** — you update status yourself (or via the extension when you apply).

---

## 1. One-time setup

### A. MongoDB

Your Atlas URI is already in `server/.env` and uses database name **WhereMyApplication**.

In Atlas Network Access, allow your current IP (or `0.0.0.0/0` for testing) so the app can connect.

### B. Install and run the app

```bash
cd WhereMyApplication
npm run install:all
npm run dev
```

That starts:

| App | URL |
|-----|-----|
| Web dashboard | http://localhost:5173 |
| API | http://127.0.0.1:5080 |

Open the web URL in your browser.

### C. Create your account

1. Go to **Register**
2. Enter name, email, password (min 8 characters)
3. You land on the **Dashboard**

Only you can see applications under this login.

### D. Fill your Profile (recommended)

Open **Profile** and add:

- Skills (comma separated)
- Preferred roles (e.g. `Frontend Engineer, Full Stack Developer`)
- Preferred locations
- **Resume text** (paste plain text) — powers Resume ↔ JD match
- Resume URL (optional)

This powers:

- “What you can improve” tips on the dashboard
- “Where to apply” LinkedIn / Indeed / Naukri search links
- Match scores on application detail + Kanban

### E. Install the Chrome extension

1. Open Chrome → `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the folder: `WhereMyApplication/extension`
5. Pin **WhereMyApplication Capture**
6. Click the icon — the **side panel** opens (stays open while you browse):
   - API base: `http://127.0.0.1:5080` (or your Render URL)
   - Sign in with the **same** email/password as the web app
   - Leave **Auto-capture LinkedIn Easy Apply** checked if you want auto-save after LinkedIn confirms apply

---

## 2. Daily workflow — how to track

### When you apply on LinkedIn / Indeed / Naukri / a company site

1. Open the job page (after or while applying)
2. Keep the WhereMyApplication **side panel** open
3. Choose status:
   - **Applied** — you already submitted
   - **Wishlist / save for later** — interesting, not applied yet
4. Click **Save this job**
5. If you already saved that job, confirm **Save anyway** for the duplicate
6. Check the web dashboard — the role appears; open it for AI enrich / match score
7. Use **Kanban** to drag applications between statuses

### LinkedIn Easy Apply (optional auto-capture)

1. Stay signed in on the side panel with Easy Apply auto-capture enabled
2. Complete Easy Apply until LinkedIn shows “application sent”
3. The extension saves the job as **Applied** (skips if duplicate)

### When you apply somewhere the extension cannot read well

1. Web app → **Add** (or `/applications/new`)
2. Fill company, role, URL, source, status, notes
3. Save

### When status changes (interview, rejection, offer)

You update this **manually** (no Gmail):

1. Open **Applications**
2. Change the status dropdown in the table, **or**
3. Open the application detail page and set status → **Save changes**

Suggested meaning of statuses:

| Status | Meaning |
|--------|---------|
| Wishlist | Saved, not applied |
| Applied | Application submitted |
| Screening | HR / recruiter screening |
| Interview | Interview scheduled or done |
| Offer | You got an offer |
| Rejected | Rejected or not moving forward |
| Withdrawn | You withdrew |

### Add notes / timeline

On the application detail page:

- Edit notes (recruiter name, salary talk, etc.)
- Use **Add note** for dated timeline entries
- Set **Follow up date** (defaults to 7 days after apply)

### Check the dashboard regularly

- Status counts (pipeline overview)
- Recent applications
- **Follow-ups due** — chase companies after ~7 days
- **What you can improve** — profile gaps, high rejection rate tips
- **Where to apply** — wishlist + search links from your preferred roles

### Export

**Applications → Export CSV** for a spreadsheet backup.

---

## 3. Recommended habit

1. After every apply → extension **Save** (or manual add)
2. When email says interview / reject / offer → open WhereMyApplication → update status + note
3. Once a week → Dashboard → clear follow-ups
4. Keep Profile skills/roles updated so tips stay useful

---

## 4. Deploy later (optional)

See `render.yaml` and `README.md`.

You will need:

- Same MongoDB Atlas `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL` (web URL)
- `VITE_API_URL` (API URL for the web build)

After deploy, set the extension **API base** to your live API URL and sign in again.

---

## 5. Troubleshooting

| Problem | Fix |
|---------|-----|
| API won’t start / Mongo error | Atlas Network Access must allow your IP; check `MONGODB_URI` in `server/.env` |
| Login works on web but not extension | Same email/password; API base must match (`http://127.0.0.1:5080`) |
| Extension “Could not read this page” | Refresh the job page; try again on the job **detail** URL, not a list page |
| Saved job has wrong title/company | Edit on the application detail page (LinkedIn DOM changes often) |
| Cannot see applications | You must be logged in; each account only sees its own data |

---

## What was left out on purpose

**Gmail auto-status sync** is not part of this build. Status changes come from:

- You updating them in the web app, or
- The extension when you save a new application
