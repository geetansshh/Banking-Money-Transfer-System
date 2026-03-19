# Bank Transfer Web Application

Simple full-stack application for creating bank accounts, transferring money, and viewing transaction history.

## Tech Stack
- Backend: Django + Django REST Framework
- Frontend: React (Vite)
- Database: SQLite

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

### 2) Frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

Note: Vite proxy is configured, so frontend calls `/api/*` and forwards to Django automatically in dev.

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

