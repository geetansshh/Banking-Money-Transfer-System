# Bank Transfer Web Application

Simple full-stack app to create accounts, transfer money, and view per-account transaction history.

## Live Links
- Application: https://banking-money-transfer-system.vercel.app/
- Backend API: https://banking-backend-3cqb.onrender.com

## Tech Stack
- Backend: Django + Django REST Framework
- Frontend: React (Vite)
- Database: PostgreSQL

## Code Structure
- `backend/banking/models.py`
  - `Account`: stores account name and current balance
  - `Transaction`: stores transfer entries with source, destination, amount, and timestamp
- `backend/banking/serializers.py`
  - Input/output validation for account creation and transfers
- `backend/banking/views.py`
  - API endpoints for account list/create, account detail/history, and transfer
- `backend/banking/urls.py`
  - Banking route mapping
- `frontend/src/App.jsx`
  - Single-page UI with 3 tabs: Accounts, Transfer, History
- `frontend/src/styles.css`
  - UI styling

## Core Logic
- Account creation creates an account with opening balance.
- Transfer API validates:
  - source account exists
  - destination account exists
  - source and destination are different
  - transfer amount is positive
  - source has enough balance
- Valid transfer updates balances and records transaction atomically.
- Account detail endpoint returns account data plus related transactions so history stays consistent.

## Assumptions
- A single user can manage multiple bank accounts in one place (portfolio-style view).
- Transfers happen only between accounts that exist inside this system.
- Authentication/authorization is out of scope for this assignment.

## API Endpoints
- `POST /api/accounts/` create account
- `GET /api/accounts/` list accounts
- `GET /api/accounts/<id>/` account detail + history
- `POST /api/transfers/` transfer money

## Local Setup
### 1) Backend
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
export DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<db_name>"
python3 backend/manage.py migrate
python3 backend/manage.py runserver
```
Backend: `http://localhost:8000`

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend: `http://localhost:5173`

Note: Vite proxy forwards `/api/*` to `http://localhost:8000` in local development.

## Sample Usage / Test Flow
1. Create account `Alice` with `1000.00`.
2. Create account `Bob` with `500.00`.
3. Transfer `200.00` from Alice to Bob.
4. Verify balances:
   - Alice: `800.00`
   - Bob: `700.00`
5. Open history for both accounts:
   - Alice shows `DEBIT`
   - Bob shows `CREDIT`
6. Try transfer `5000.00` from Alice to Bob and verify rejection.

## Tests
Run backend tests:
```bash
python3 backend/manage.py test banking
```
