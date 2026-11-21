# SIT313 Task D2 - Browse Posts (DEV@Deakin)

React (Vite) frontend + Express backend using the Firebase Admin SDK.

## What D2 adds
- **New Post** form: Question/Article, **Free/Paid post plan**, title, abstract + article text (articles), tags, validated on both frontend and backend; alerts the user of the outcome.
- Posts are **saved by the backend** (`POST /api/posts`, login required via Firebase ID token). Stored with `authorId`, `authorEmail`, `createdAt` (server timestamp).
- **Browse Posts** page (nav bar link). The frontend asks the backend (`GET /api/posts`); the backend verifies the token, reads the user's plan from Firestore and returns:
  - visitor -> free posts only
  - Free plan -> free posts only
  - Paid plan -> free + paid posts
  Paid posts for non-paid users are never sent to the browser.
- Filtering (type, plan, tag, date range), **Hide** (UI only, Firestore untouched), **Reset**, **Expand/Collapse**, and optional **drag-to-reorder** (native HTML5, no extra package).
- `firestore.rules` now blocks all direct client access to `posts`.

## Setup
### 1. Firebase service account (backend)
Firebase Console -> Project settings -> Service accounts -> **Generate new private key**.
Save it as `backend/serviceAccountKey.json` (git-ignored, **never commit it**).

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env     # set RESEND_API_KEY
npm start                # http://localhost:3000
```
> `server.js` (from P5) requires `RESEND_API_KEY` to be set; use your real key or a placeholder.

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:3000
npm run dev              # http://localhost:5173
```

### 4. Firestore rules
Publish `firestore.rules` in Firebase Console -> Firestore -> Rules.

## Test cases for the video
1. Register two users, login/logout (Free label shows in the nav bar).
2. Logged in: create a Free article and a Paid question; try invalid input (short title, 4 tags) -> error alert.
3. Logged out (visitor) and as Free user: Browse Posts shows free posts only.
4. Pricing -> Upgrade with a valid demo card (invalid card is rejected) -> Browse Posts now shows paid posts too.
5. Filter, Hide, Reset, Expand, drag to reorder.

## GitLab
Create project **Task D2** with visibility **Internal**. Do not commit `node_modules`, `.env` or `serviceAccountKey.json` (all in `.gitignore`).
