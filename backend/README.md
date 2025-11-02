Smart Expense Tracker - Backend Starter (Flask)
=============================================

What's included
- Flask app scaffold (app.py)
- SQLAlchemy models (models.py)
- Basic API routes (routes.py)
- Forecast stub (forecast_stub.py)
- Seed script (seed.py) to add demo data
- .env.example and requirements.txt

Quick start (Linux / WSL / macOS)
1. Copy .env.example to .env and edit DATABASE_URL & SECRET_KEY.
   cp .env.example .env
   # edit .env and set real values

2. Create virtualenv and install
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

Note about Prophet
- Prophet can be hard to install on some systems. If you face issues, consider using 'neuralprophet' or remove 'prophet' from requirements and use SARIMAX via statsmodels for forecasting.

Database setup (Postgres)
- Make sure PostgreSQL is running and DATABASE_URL in .env is correct.
- Init migrations:
   export FLASK_APP=app.py
   flask db init
   flask db migrate -m "initial"
   flask db upgrade

Seed demo data
   python seed.py

Run the app (dev)
   export FLASK_APP=app.py
   flask run

API examples
- Health
  GET /health

- Add transaction
  POST /api/transactions
  { "name": "KFC Zinger", "amount": 249.00, "date": "2025-10-30", "category": "Food" }

- List transactions
  GET /api/transactions?start=2025-09-01&end=2025-09-30

- AI categorize (stub)
  POST /api/ai/categorize
  { "name": "Netflix Subscription" }

License
- Feel free to use and modify for your project. Good luck! - Abhi
