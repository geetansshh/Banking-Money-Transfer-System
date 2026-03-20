# Bank Transfer Web Application

Simple full-stack application for creating bank accounts, transferring money, and viewing transaction history.

## Tech Stack
- Backend: Django + Django REST Framework
- Frontend: React (Vite)
- Database: PostgreSQL

## Scope Covered
- Create user bank accounts with starting balance
- View account balance and full transaction history
- Transfer money between accounts
- Block transfers that exceed source balance
- Show updated transaction history immediately after each transfer

## Project Structure
- `backend/` Django REST API
- `frontend/` React UI

## Backend API Endpoints
- `POST /api/accounts/` create account
- `GET /api/accounts/` list accounts
- `GET /api/accounts/<id>/` account detail + transaction history
- `POST /api/transfers/` transfer between accounts

## Local Setup
### 1) Backend
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python3 backend/manage.py migrate
python3 backend/manage.py runserver
```
Backend runs at `http://localhost:8000`.

By default, backend uses local PostgreSQL database `bank_transfer_db` on `127.0.0.1:5432` with your OS username.  
For cloud/custom DB, set `DATABASE_URL` explicitly. See `backend/.env.example`.

### 2) Frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

Note: Vite proxy is configured, so frontend calls `/api/*` and forwards to Django automatically in dev.

## Deploy (Neon + Render + Vercel)
### 1) Neon (PostgreSQL)
1. Create a Neon project and database.
2. Copy the connection string (it includes `sslmode=require`).
3. Keep it ready as `DATABASE_URL`.

### 2) Render (Django API)
1. Create a new **Web Service** from this GitHub repo.
2. Set **Root Directory** to `backend`.
3. Build Command:
```bash
pip install -r requirements.txt && python manage.py migrate
```
4. Start Command:
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```
5. Add environment variables:
   - `SECRET_KEY=<strong-random-secret>`
   - `DEBUG=False`
   - `ALLOWED_HOSTS=<your-render-service>.onrender.com`
   - `DATABASE_URL=<neon-connection-string>`
   - `DB_SSL_REQUIRE=True`
   - `CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app`

### 3) Vercel (React UI)
1. Create a new Vercel project from the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Add environment variable:
   - `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api`
4. Deploy.

### 4) Post-deploy smoke test
1. Create two accounts.
2. Transfer an amount between them.
3. Verify history updates and over-limit transfer is blocked.

## Sample Test Flow
1. Create account `Alice` with `1000.00`
2. Create account `Bob` with `500.00`
3. Transfer `200.00` from Alice to Bob
4. Verify balances:
   - Alice: `800.00`
   - Bob: `700.00`
5. Open account history and confirm transfer appears as:
   - Alice: `DEBIT`
   - Bob: `CREDIT`
6. Try transfer `5000.00` from Alice to Bob and confirm it is rejected

## Backend Tests
```bash
python3 backend/manage.py test banking
```

## Design Notes (KISS, SoC, DRY)
- Clear separation: models, serializers, views, URLs
- Atomic transfer logic in one API to ensure consistent balances
- Single transaction table reused for account history (debit/credit derived per account)
- Minimal UI state and API helpers to avoid duplicated network logic

## Submission Deliverables
- Live URL: deploy this project (backend + frontend) to your preferred platform
- GitHub Repository: push this codebase to your GitHub repo
