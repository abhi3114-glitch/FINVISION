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
    try:
        verify_jwt_in_request()
    except Exception:
        pass

    identity = get_jwt_identity()
    if identity:
        user = User.query.get(identity)
        if user:
            return user

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
# 💸 Transactions (with filters)
# ------------------------------------------------------------
@api_bp.route("/transactions", methods=["POST"])
@jwt_required(optional=True)
def add_transaction():
    data = request.json or {}
    user = get_current_user()
    name = data.get("name", "").strip()
    amount = float(data.get("amount", 0))
    date_str = data.get("date")
    date = datetime.fromisoformat(date_str).date() if date_str else datetime.utcnow().date()
    category = data.get("category", "Uncategorized")

    t = Transaction(user_id=user.id, name=name, amount=amount, date=date, category=category)
    db.session.add(t)
    db.session.commit()
    return jsonify({"status": "ok", "transaction_id": t.id, "auto_category": category})


@api_bp.route("/transactions", methods=["GET"])
@jwt_required(optional=True)
def list_transactions():
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

    results = q.order_by(Transaction.date.desc()).limit(500).all()
    return jsonify([
        {
            "id": r.id,
            "date": r.date.isoformat(),
            "name": r.name,
            "amount": float(r.amount),
            "category": r.category,
        } for r in results
    ])


# ------------------------------------------------------------
# 📊 Summary (supports filters)
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

    total = q.with_entities(func.coalesce(func.sum(Transaction.amount), 0)).scalar() or 0
    return jsonify({"total": float(total)})


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

    goal = Goal(
        user_id=user.id,
        name=data["name"],
        target_amount=float(data["target_amount"]),
        duration_months=int(data.get("duration_months", 0)),
        start_date=datetime.utcnow().date(),
        saved_amount=float(data.get("saved_amount", 0.0))
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify({"status": "ok", "goal_id": goal.id})


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
    add_amount = float(data.get("saved_amount", 0.0))
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
# 🧠 Groq AI Utility (LLaMA)
# ------------------------------------------------------------
def call_groq_ai(prompt, model=None):
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
    goal_name = data.get("goal_name")
    target_amount = data.get("target_amount")

    txs = Transaction.query.filter_by(user_id=user.id).all()
    category_spend = {}
    for t in txs:
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
    data = request.json
    user_message = data.get("message", "")
    user = get_current_user()

    txs = Transaction.query.filter_by(user_id=user.id).all()
    summary = {}
    for t in txs:
        summary[t.category] = summary.get(t.category, 0) + float(t.amount)

    prompt = f"""
    You are FinVision AI — a friendly personal finance assistant.
    Spending summary: {json.dumps(summary, indent=2)}
    User says: "{user_message}"
    Keep reply short, smart, and supportive.
    """

    return jsonify(call_groq_ai(prompt))


# ------------------------------------------------------------
# 📈 AI Spending Forecast (with filters)
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
    monthly_spend = {}
    for t in txs:
        m = t.date.strftime("%b %Y")
        monthly_spend[m] = monthly_spend.get(m, 0) + float(t.amount)

    prompt = f"""
    You are FinVision AI — a precise and friendly finance forecaster.
    Category: {category or "All"} | Range: {start or "N/A"} → {end or "Now"}
    Monthly spending: {json.dumps(monthly_spend, indent=2)}

    ✳️ Task:
    Predict next month’s total (₹), one reason, and one motivational line.
    Max 3 lines.
    """

    return jsonify(call_groq_ai(prompt))


# ------------------------------------------------------------
# 🧠 AI Dashboard Insights (with filters)
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
    total_spent = sum(float(t.amount) for t in txs)
    monthly_spend = {}
    for t in txs:
        m = t.date.strftime("%b %Y")
        monthly_spend[m] = monthly_spend.get(m, 0) + float(t.amount)

    prompt = f"""
    You are FinVision AI — a personal finance assistant.
    Analyze Category: {category or "All"} | Range: {start or "N/A"} → {end or "Now"}.
    Data: {json.dumps(monthly_spend, indent=2)}.
    Total spending: ₹{total_spent}.

    ✳️ Generate:
    - 1 short advice (<15 words)
    - Estimated free cash left (₹)
    - Savings rate (%)

    Format JSON only:
    {{
      "advice": "text",
      "free_cash": 3200,
      "savings_rate": 12
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

    return jsonify({
        "advice": "Spend wisely this week 🧠",
        "free_cash": 3000,
        "savings_rate": 10
    })


# ------------------------------------------------------------
# ❤️ Health Check
# ------------------------------------------------------------
@api_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "oauth": True, "ai": True, "user": True})
