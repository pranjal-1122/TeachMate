# TeachMate: Intelligent Teaching Preparation & Student Micro-Learning System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?style=flat&logo=PostgreSQL&logoColor=white)](https://www.postgresql.org)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.5%20Flash-4285F4.svg?style=flat&logo=Google&logoColor=white)](https://ai.google.dev)

TeachMate is a full-stack, production-grade agentic AI teaching preparation and student micro-learning web application. Built strictly to curriculum standards, it pairs educator diagnostic preparation with interactive student micro-learning.

---

## 🌟 Key Features

### 👩‍🏫 1. Teacher Preparation Pipeline
- **Diagnostic Generation:** Automatically generates exactly 5 conceptual, application, and misconception-targeted diagnostic questions.
- **Rubric Knowledge Gap Analysis:** AI-assisted scoring against reference rubrics with strengths and gap extraction.
- **Deterministic 80% Readiness Threshold:** Safe Python-enforced gating before lesson generation.
- **Targeted Revision Loops:** Automated revision notes and fresh quick-check questions, capped at 3 rounds with explicit teacher override acknowledgments.
- **Interactive Lesson Studio:** Generates learning objectives, hooks, conceptual sections, classroom activities, and live **Mermaid diagrams**.

### 🧑‍🎓 2. Student Micro-Learning Experience
- **Explore Catalog:** Search and filter verified lessons across subjects and grade levels.
- **Vertical Scroll-Learning Cards:** Bite-sized interactive cards with native keyboard navigation (`↓`/`j`, `↑`/`k`), progress tracking, and embedded diagrams.
- **5-Question Knowledge Quiz:** Dynamic multiple-choice quiz with server-withheld keys and instant explanatory feedback.
- **Gamification Engine:** Calendar-day streak calculations and verified database badge milestones (*First Lesson*, *Consistent Learner*, *Quiz Explorer*, *Lesson Finisher*).

---

## 🚀 Free Cloud Deployment

TeachMate comes pre-configured for free cloud deployment on **Render.com**, **Railway**, and **Vercel**.

### Option A: 1-Click Deployment on Render.com (Recommended)

Render provides free hosting for Web Services, Static Sites, and PostgreSQL databases using the included [`render.yaml`](render.yaml) Blueprint.

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial TeachMate commit"
   # Create a new repository on github.com, then:
   git remote add origin https://github.com/<your-username>/TeachMate.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Log into [Render.com](https://render.com).
   - In the dashboard, click **New +** → **Blueprint**.
   - Connect your GitHub repository.
   - Render will detect [`render.yaml`](render.yaml) and automatically create:
     1. `teachmate-db` (Free PostgreSQL database)
     2. `teachmate-backend` (Free Python FastAPI Web Service)
     3. `teachmate-frontend` (Free React Static Site)
   - When prompted for Environment Variables:
     - Set `GEMINI_API_KEY`: Paste your Google Gemini API key.
     - Set `VITE_API_URL`: Set to `https://<your-backend-name>.onrender.com/api/v1`
   - Click **Apply**. Render will automatically provision the database, run Alembic migrations, and deploy your live public URLs!

---

### Option B: Railway Deployment

Railway supports automatic builds using [`railway.toml`](railway.toml) and [`Procfile`](Procfile):

1. Go to [Railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Add a **PostgreSQL database** plugin inside your project canvas.
4. Add environment variables to your backend service:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
   - `SESSION_SECRET`: Any random 32-character string
5. Railway will automatically run migrations and deploy.

---

### Option C: Split Deployment (Vercel Frontend + Render/Neon Backend)

If you prefer Vercel for the React frontend:
1. Deploy the `backend/` directory on Render or Railway.
2. In [Vercel](https://vercel.com), click **Add New** → **Project** → select your repo.
3. Set **Root Directory** to `frontend`.
4. Add the environment variable:
   - `VITE_API_URL` = `https://<your-backend-url>/api/v1`
5. Click **Deploy**. Vercel uses the included [`frontend/vercel.json`](frontend/vercel.json) to handle client-side SPA routing.

---

## 💻 Local Development Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16 (`brew services start postgresql@16`)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
# Edit .env and paste your GEMINI_API_KEY

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start Vite dev server
npm run dev -- --host 127.0.0.1 --port 5173
```

- **Web App:** [http://localhost:5173](http://localhost:5173)
- **API Docs (Swagger UI):** [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

---

## 🧪 Testing

Run the full automated test suite (16 tests across auth, multi-agent sessions, 3-round revision caps, quiz secrecy, and streak engines):

```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest tests/ -v
```

---

## 🎨 Design System & Accessibility

- **60-30-10 Palette:**
  - Canvas (60%): `#F5F3ED` (Warm Parchment)
  - Structure & Typography (30%): `#203F36` (Deep Forest)
  - Accent & Interactive (10%): `#C7664F` (Terracotta)
- **Accessibility:** WCAG 2.2 AA compliant, high-contrast dark theme, keyboard navigation shortcuts, and focus rings.
