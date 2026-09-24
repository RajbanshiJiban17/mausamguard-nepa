# MausamGuard Nepal - Run & Deployment Guide

This guide provides step-by-step instructions to run the application locally, push it to GitHub, and deploy it to production.

---

## 1. Local Run Guide (स्थानीय रूपमा कसरी चलाउने)

### Option A: One-Click Launcher (Recommended for Windows)
Double-click `run_dev.bat` or execute in PowerShell:
```powershell
.\run_dev.ps1
```
This automatically initializes the database (if missing), starts the FastAPI backend on `http://localhost:8000`, and starts the React frontend on `http://localhost:5173`.

---

### Option B: Manual Command Line

#### Terminal 1: Backend
```powershell
# Set backend directory into PYTHONPATH and start uvicorn
$env:PYTHONPATH="c:\Users\User\Desktop\EWS\backend"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- Redoc API Docs: `http://localhost:8000/redoc`

#### Terminal 2: Frontend
```powershell
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

### Option C: Run via Docker Compose Locally
```bash
docker compose up -d --build
```
- Frontend (Nginx SPA + Reverse Proxy): `http://localhost`
- Backend API: `http://localhost:8000`

---

## 2. GitHub मा Push गर्ने तरिका (Step-by-Step Git Push)

If you haven't initialized Git yet, run these commands in the project root:

```bash
# 1. Initialize git
git init

# 2. Check status (node_modules and local DB are ignored by .gitignore)
git status

# 3. Add all files
git add .

# 4. Commit files
git commit -m "feat: complete MausamGuard Nepal multi-hazard early warning system"

# 5. Set branch to main
git branch -M main

# 6. Add your GitHub repository remote (replace YOUR-USERNAME with your github username)
git remote add origin https://github.com/YOUR-USERNAME/mausamguard-nepal.git

# 7. Push to GitHub
git push -u origin main
```

> **Note:** Once pushed, GitHub Actions (`.github/workflows/ci-cd.yml`) will automatically validate the 77-district dataset, seed the database, run all 25 unit tests, and verify the frontend build.

---

## 3. Direct Production Deployment (उत्पादनमा कसरी डिप्लोय गर्ने)

### Strategy 1: Free Cloud Deployment (Vercel + Render) — Recommended

This is the fastest, free, and zero-maintenance architecture.

#### Step 1: Deploy Backend on Render (Free Tier)
1. Go to [render.com](https://render.com) and log in with GitHub.
2. Click **New +** $\to$ **Web Service**.
3. Select your `mausamguard-nepal` repository.
4. Settings:
   - **Environment:** Docker
   - **Dockerfile Path:** `Dockerfile.backend`
   - **Instance Type:** Free
   - **Region:** Singapore (`singapore`)
5. In **Environment Variables**, add:
   - `ENVIRONMENT` = `production`
   - `CORS_ORIGINS` = `*`
   - `DATABASE_URL` = `sqlite:///./mausamguard.db`
   - `JWT_SECRET` = (Generate a random 32-character string)
6. Click **Create Web Service**.
7. Once deployed, Render will provide a URL, e.g.:
   `https://mausamguard-backend.onrender.com`

---

#### Step 2: Deploy Frontend on Vercel (Free Tier)
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** $\to$ **Project** and import `mausamguard-nepal`.
3. Configure the Project:
   - **Root Directory:** click Edit and select `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Expand **Environment Variables**:
   - `VITE_API_URL` = `https://mausamguard-backend.onrender.com` *(use your Render URL from Step 1)*
5. Click **Deploy**.
6. Vercel will build and launch your live application at `https://mausamguard-nepal.vercel.app`!

---

### Strategy 2: Single VPS / Cloud Server (Docker Compose)

Deploy everything onto any Linux VPS (Ubuntu 22.04 / 24.04 on DigitalOcean, Hetzner, AWS EC2, Linode):

1. SSH into your VPS:
   ```bash
   ssh root@your-server-ip
   ```
2. Install Docker & Docker Compose:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
   apt-get install -y docker-compose-plugin
   ```
3. Clone your repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/mausamguard-nepal.git
   cd mausamguard-nepal
   ```
4. Start all containers:
   ```bash
   docker compose up -d --build
   ```
5. View logs and check health:
   ```bash
   docker compose logs -f
   ```
Your system is now serving on `http://your-server-ip` with reverse proxy, automatic health checks, and 24/7 background scheduled jobs!
