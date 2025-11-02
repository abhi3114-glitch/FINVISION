# routes.py
from flask import Blueprint, request, jsonify, redirect, url_for, session, current_app
from extensions import db, oauth
from models import User, Transaction, Goal
from datetime import datetime, timedelta
from sqlalchemy import func
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    verify_jwt_in_request,
)
import os
import json
import re
import requests

api_bp = Blueprint("api", __name__)

# ------------------------------------------------------------
# 🔐 Google OAuth Setup
# ------------------------------------------------------------
google = oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# ------------------------------------------------------------
# 🔑 Google Login & Callback
# ------------------------------------------------------------
@api_bp.route("/auth/google", methods=["GET"])
def google_login():
    redirect_uri = url_for("api.google_callback", _external=True)
    return google.authorize_redirect(redirect_uri)


@api_bp.route("/auth/callback", methods=["GET"])
def google_callback():
    try:
        token = google.authorize_access_token()
        user_info = google.get("https://www.googleapis.com/oauth2/v3/userinfo").json()

        if not user_info or "email" not in user_info:
            return redirect("http://localhost:3000/login?error=invalid_user")

        email = user_info["email"]
        name = user_info.get("name", "User")
        picture = user_info.get("picture")

        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(name=name, email=email, picture=picture)
            db.session.add(user)
            db.session.commit()
        elif picture and user.picture != picture:
            user.picture = picture
            db.session.commit()

        access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(minutes=15))
        refresh_token = create_refresh_token(identity=str(user.id), expires_delta=timedelta(days=7))

        session["user_id"] = user.id
        session["jwt_token"] = access_token

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        redirect_url = (
            f"{frontend_url}/auth/callback"
            f"?token={access_token}"
            f"&refresh={refresh_token}"
            f"&name={name}"
            f"&email={email}"
            f"&picture={picture}"
        )
        return redirect(redirect_url)

    except Exception as e:
        current_app.logger.error(f"Google OAuth Error: {e}")
        return redirect("http://localhost:3000/login?error=auth_failed")


# ------------------------------------------------------------
# 🧠 Helper: Get Current User
# ------------------------------------------------------------
def get_current_user():
    """
    Try verifying JWT first. If not present or invalid, fall back to
    the first user (demo) — created if none exists.
    """
    try:
        verify_jwt_in_request()
    except Exception:
        pass

    identity = get_jwt_identity()
    if identity:
        user = User.query.get(identity)
        if user:
            return user

    # Fallback demo user
    u = User.query.first()
    if not u:
        u = User(name="Demo User", email="demo@example.com")
        db.session.add(u)
        db.session.commit()
    return u


# ------------------------------------------------------------
# 👤 User Info
# ------------------------------------------------------------
@api_bp.route("/user/me", methods=["GET"])
@jwt_required(optional=True)
def user_me():
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "picture": user.picture
    })


# ------------------------------------------------------------
# 🚪 Logout
# ------------------------------------------------------------
@api_bp.route("/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully!"})


# ------------------------------------------------------------
# 💸 Transactions CRUD (supports filters)
# ------------------------------------------------------------
@api_bp.route("/transactions", methods=["POST"])
@jwt_required(optional=True)
def add_transaction():
    data = request.json or {}
    user = get_current_user()

    name = data.get("name", "").strip()
    # ensure numeric amount
    try:
        amount = float(data.get("amount", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid amount"}), 400

    txn_type = data.get("type", "expense")  # expected 'income' or 'expense'
    category = data.get("category", "Uncategorized")
    date_str = data.get("date")
    date = None
    if date_str:
        try:
            date = datetime.fromisoformat(date_str).date()
        except Exception:
            return jsonify({"error": "Invalid date format, use ISO format (YYYY-MM-DD)"}), 400
    else:
        date = datetime.utcnow().date()

    if not name or amount == 0:
        return jsonify({"error": "Missing name or amount"}), 400

    txn = Transaction(
        user_id=user.id,
        name=name,
        amount=amount,
        category=category,
        # some model versions may not have `type` attribute — assuming model includes it
        type=txn_type,
        date=date
    )
    db.session.add(txn)
    db.session.commit()

    return jsonify({"message": "Transaction added successfully!", "id": txn.id}), 201


@api_bp.route("/transactions", methods=["GET"])
@jwt_required(optional=True)
def list_transactions():
    user = get_current_user()
    start = request.args.get("start")
    end = request.args.get("end")
    category = request.args.get("category")
    txn_type = request.args.get("type")  # optional filter by type

    q = Transaction.query.filter(Transaction.user_id == user.id)
    if start:
        q = q.filter(Transaction.date >= start)
    if end:
        q = q.filter(Transaction.date <= end)
    if category and category.lower() != "all":
        q = q.filter(Transaction.category == category)
    if txn_type and txn_type.lower() != "all":
        q = q.filter(Transaction.type == txn_type)

    txs = q.order_by(Transaction.date.desc()).limit(500).all()
    return jsonify([
        {
            "id": t.id,
            "name": t.name,
            "amount": float(t.amount),
            "type": getattr(t, "type", "expense"),
            "category": t.category,
            "date": t.date.isoformat() if getattr(t, "date", None) else None,
        }
        for t in txs
    ])


@api_bp.route("/transactions/<int:transaction_id>", methods=["DELETE"])
@jwt_required(optional=True)
def delete_transaction(transaction_id):
    user = get_current_user()
    txn = Transaction.query.filter_by(id=transaction_id, user_id=user.id).first()
    if not txn:
        return jsonify({"error": "Transaction not found"}), 404

    db.session.delete(txn)
    db.session.commit()
    return jsonify({"message": "Transaction deleted successfully!"})


# ------------------------------------------------------------
# 📊 General Summary (with filters)
# ------------------------------------------------------------
@api_bp.route("/summary", methods=["GET"])
@jwt_required(optional=True)
def summary():
    user = get_current_user()
    start = request.args.get("start")
    end = request.args.get("end")
    category = request.args.get("category")

    q = Transaction.query.filter(Transaction.user_id == user.id)
    if start:
        q = q.filter(Transaction.date >= start)
    if end:
        q = q.filter(Transaction.date <= end)
    if category and category.lower() != "all":
        q = q.filter(Transaction.category == category)

    # Separate totals by type
    total_income = (
        q.with_entities(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.type == "income")
        .scalar()
        or 0
    )
    total_expense = (
        q.with_entities(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.type == "expense")
        .scalar()
        or 0
    )
    net_balance = float(total_income) - float(total_expense)

    return jsonify({
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "net_balance": net_balance
    })


# ------------------------------------------------------------
# 💰 Dashboard Summary (Income, Expense, Free Cash, Saving %)
# ------------------------------------------------------------
@api_bp.route("/dashboard/summary/<int:user_id>", methods=["GET"])
@jwt_required(optional=True)
def dashboard_summary(user_id):
    start = request.args.get("start")
    end = request.args.get("end")
    category = request.args.get("category")

    q = Transaction.query.filter(Transaction.user_id == user_id)
    if start:
        q = q.filter(Transaction.date >= start)
    if end:
        q = q.filter(Transaction.date <= end)
    if category and category.lower() != "all":
        q = q.filter(Transaction.category == category)

    txs = q.all()

    if not txs:
        return jsonify({
            "total_income": 0,
            "total_expense": 0,
            "free_cash": 0,
            "saving_percent": 0
        })

    income = sum(float(t.amount) for t in txs if getattr(t, "type", "expense") == "income")
    expense = sum(float(t.amount) for t in txs if getattr(t, "type", "expense") == "expense")
    free_cash = income - expense
    saving_percent = (free_cash / income * 100) if income > 0 else 0

    return jsonify({
        "total_income": round(income, 2),
        "total_expense": round(expense, 2),
        "free_cash": round(free_cash, 2),
        "saving_percent": round(saving_percent, 2)
    })


# ------------------------------------------------------------
# 🎯 Goals (Add, List, Update, Delete)
# ------------------------------------------------------------
@api_bp.route("/goals", methods=["POST"])
@jwt_required(optional=True)
def add_goal():
    data = request.json or {}
    user = get_current_user()

    if not data.get("name") or not data.get("target_amount"):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        target_amount = float(data["target_amount"])
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid target_amount"}), 400

    goal = Goal(
        user_id=user.id,
        name=data["name"],
        target_amount=target_amount,
        duration_months=int(data.get("duration_months", 0)),
        start_date=datetime.utcnow().date(),
        saved_amount=float(data.get("saved_amount", 0.0))
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify({"message": "Goal added successfully!", "goal_id": goal.id}), 201


@api_bp.route("/goals", methods=["GET"])
@jwt_required(optional=True)
def list_goals():
    user = get_current_user()
    goals = Goal.query.filter_by(user_id=user.id).all()
    return jsonify([
        {
            "id": g.id,
            "name": g.name,
            "target_amount": float(g.target_amount),
            "saved_amount": float(getattr(g, "saved_amount", 0.0)),
            "duration_months": g.duration_months,
            "start_date": g.start_date.isoformat() if g.start_date else None,
        } for g in goals
    ])


@api_bp.route("/goals/<int:goal_id>", methods=["PATCH"])
@jwt_required()
def update_goal(goal_id):
    data = request.json or {}
    user = get_current_user()
    goal = Goal.query.filter_by(id=goal_id, user_id=user.id).first()
    if not goal:
        return jsonify({"error": "Goal not found"}), 404

    current_saved = float(goal.saved_amount or 0.0)
    try:
        add_amount = float(data.get("saved_amount", 0.0))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid saved_amount"}), 400

    goal.saved_amount = current_saved + add_amount
    db.session.commit()
    return jsonify({"status": "updated", "goal_id": goal.id, "saved_amount": goal.saved_amount})


@api_bp.route("/goals/<int:goal_id>", methods=["DELETE"])
@jwt_required()
def delete_goal(goal_id):
    user = get_current_user()
    goal = Goal.query.filter_by(id=goal_id, user_id=user.id).first()
    if not goal:
        return jsonify({"error": "Goal not found"}), 404

    db.session.delete(goal)
    db.session.commit()
    return jsonify({"status": "deleted", "goal_id": goal_id})


# ------------------------------------------------------------
# 🧠 Groq AI Utility (LLaMA Tuned)
# ------------------------------------------------------------
def call_groq_ai(prompt, model=None):
    """
    Call Groq AI endpoint and return a cleaned reply dict:
    { "reply": "..." } or { "error": "..." }
    """
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
        "Content-Type": "application/json"
    }
    model = model or "llama-3.1-8b-instant"

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.6,
        "max_tokens": 300
    }

    try:
        res = requests.post(url, headers=headers, json=payload, timeout=40)
        data = res.json()
        if res.status_code != 200:
            return {"error": f"Groq API Error {res.status_code}: {data}"}

        text = data["choices"][0]["message"]["content"].strip()
        clean = re.sub(r"<.*?>", "", text)
        clean = re.sub(r"(?i)(okay|let's|hmm|wait|so,|well,).*?\.", "", clean)
        clean = re.sub(r"\n{2,}", "\n", clean).strip()
        if len(clean) > 400:
            clean = clean[:400].rsplit(".", 1)[0] + "..."
        return {"reply": clean}

    except Exception as e:
        current_app.logger.error(f"Groq AI Error: {e}")
        return {"error": "Groq AI request failed."}


# ------------------------------------------------------------
# 💡 AI Goal Tips
# ------------------------------------------------------------
@api_bp.route("/ai/goal_tips", methods=["POST"])
@jwt_required()
def ai_goal_tips():
    data = request.json or {}
    user = get_current_user()
    goal_name = data.get("goal_name", "Unnamed Goal")
    target_amount = data.get("target_amount", "0")

    txs = Transaction.query.filter_by(user_id=user.id).all()
    category_spend = {}
    for t in txs:
        if getattr(t, "type", "expense") == "expense":  # ✅ Only count expenses for spending analysis
            category_spend[t.category] = category_spend.get(t.category, 0) + float(t.amount)

    prompt = f"""
    You are FinVision AI — a warm and concise money coach.
    Goal: "{goal_name}" (₹{target_amount})
    Spending pattern: {json.dumps(category_spend, indent=2)}

    ✳️ Task:
    Write 3 short motivational saving tips with emojis.
    Keep each line under 20 words.
    Format:
    1. 💰 ...
    2. 📉 ...
    3. 📈 ...
    """

    return jsonify(call_groq_ai(prompt))


# ------------------------------------------------------------
# 💬 AI Chatbot
# ------------------------------------------------------------
@api_bp.route("/ai/chat", methods=["POST"])
@jwt_required()
def ai_chat():
    data = request.json or {}
    user_message = data.get("message", "")
    user = get_current_user()

    txs = Transaction.query.filter_by(user_id=user.id).all()
    summary = {}
    for t in txs:
        if getattr(t, "type", "expense") == "expense":  # ✅ Only count expenses for spending analysis
            summary[t.category] = summary.get(t.category, 0) + float(t.amount)

    prompt = f"""
    You are FinVision AI — a friendly personal finance assistant.
    Spending summary: {json.dumps(summary, indent=2)}
    User says: "{user_message}"
    Keep reply short, smart, and supportive.
    """

    return jsonify(call_groq_ai(prompt))


# ------------------------------------------------------------
# 📈 AI Spending Forecast (with filters) - FIXED
# ------------------------------------------------------------
@api_bp.route("/ai/spending_forecast", methods=["GET"])
@jwt_required()
def ai_spending_forecast():
    user = get_current_user()
    start = request.args.get("start")
    end = request.args.get("end")
    category = request.args.get("category")

    q = Transaction.query.filter(Transaction.user_id == user.id)
    if start:
        q = q.filter(Transaction.date >= start)
    if end:
        q = q.filter(Transaction.date <= end)
    if category and category.lower() != "all":
        q = q.filter(Transaction.category == category)

    txs = q.all()
    
    # ✅ FIXED: Separate income and expense
    monthly_income = {}
    monthly_expense = {}
    
    for t in txs:
        m = t.date.strftime("%b %Y")
        amount = float(t.amount)
        if getattr(t, "type", "expense") == "income":
            monthly_income[m] = monthly_income.get(m, 0) + amount
        else:
            monthly_expense[m] = monthly_expense.get(m, 0) + amount

    total_income = sum(monthly_income.values())
    total_expense = sum(monthly_expense.values())
    net_savings = total_income - total_expense

    prompt = f"""
    You are FinVision AI — a precise and friendly finance forecaster.
    Category: {category or "All"} | Range: {start or "N/A"} → {end or "Now"}
    
    💰 Income by month: {json.dumps(monthly_income, indent=2)}
    💸 Expense by month: {json.dumps(monthly_expense, indent=2)}
    📊 Net Savings: ₹{net_savings:.2f}

    ✳️ Task:
    Analyze the income vs expense pattern and predict next month's financial outlook.
    Focus on savings potential and spending habits.
    Max 3 lines.
    """

    return jsonify(call_groq_ai(prompt))


# ------------------------------------------------------------
# 🧠 AI Dashboard Insights (with filters) - FIXED
# ------------------------------------------------------------
@api_bp.route("/ai/dashboard_insights", methods=["GET"])
@jwt_required()
def ai_dashboard_insights():
    user = get_current_user()
    start = request.args.get("start")
    end = request.args.get("end")
    category = request.args.get("category")

    q = Transaction.query.filter(Transaction.user_id == user.id)
    if start:
        q = q.filter(Transaction.date >= start)
    if end:
        q = q.filter(Transaction.date <= end)
    if category and category.lower() != "all":
        q = q.filter(Transaction.category == category)

    txs = q.all()
    
    # ✅ FIXED: Separate income and expense
    total_income = sum(float(t.amount) for t in txs if getattr(t, "type", "expense") == "income")
    total_expense = sum(float(t.amount) for t in txs if getattr(t, "type", "expense") == "expense")
    free_cash = total_income - total_expense
    savings_rate = (free_cash / total_income * 100) if total_income > 0 else 0

    monthly_spend = {}
    for t in txs:
        if getattr(t, "type", "expense") == "expense":  # ✅ Only expenses for spending analysis
            m = t.date.strftime("%b %Y")
            monthly_spend[m] = monthly_spend.get(m, 0) + float(t.amount)

    prompt = f"""
    You are FinVision AI — a personal finance assistant.
    Analyze Category: {category or "All"} | Range: {start or "N/A"} → {end or "Now"}.
    
    📈 Income: ₹{total_income:.2f}
    📉 Expense: ₹{total_expense:.2f}
    💰 Free Cash: ₹{free_cash:.2f}
    🎯 Savings Rate: {savings_rate:.1f}%
    Monthly Expenses: {json.dumps(monthly_spend, indent=2)}

    ✳️ Generate:
    - 1 short advice (<15 words)
    - Estimated free cash left (₹) - use the actual calculated free_cash
    - Savings rate (%) - use the actual calculated savings_rate

    Format JSON only:
    {{
      "advice": "text",
      "free_cash": {free_cash:.2f},
      "savings_rate": {savings_rate:.1f}
    }}
    """

    res = call_groq_ai(prompt)
    reply = res.get("reply", "")

    try:
        match = re.search(r"\{.*\}", reply, re.S)
        if match:
            return jsonify(json.loads(match.group(0)))
    except Exception:
        pass

    # ✅ FIXED: Return actual calculated values instead of hardcoded ones
    return jsonify({
        "advice": f"Your savings rate is {savings_rate:.1f}% - {'Great job!' if savings_rate > 20 else 'Room for improvement!'}",
        "free_cash": free_cash,
        "savings_rate": savings_rate
    })


# ------------------------------------------------------------
# ❤️ Health Check
# ------------------------------------------------------------
@api_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "oauth": True, "ai": True, "user": True})