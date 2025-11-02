# models.py
from extensions import db
from datetime import datetime


# ------------------------------------------------------------
# 👤 USER MODEL
# ------------------------------------------------------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=True)
    picture = db.Column(db.String(500), nullable=True)  # ✅ For Google OAuth
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    transactions = db.relationship("Transaction", backref="user", lazy=True, cascade="all, delete-orphan")
    goals = db.relationship("Goal", backref="user", lazy=True, cascade="all, delete-orphan")
    forecasts = db.relationship("Forecast", backref="user", lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"


# ------------------------------------------------------------
# 💸 TRANSACTION MODEL
# ------------------------------------------------------------
class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    date = db.Column(db.Date, default=datetime.utcnow, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.String(100), nullable=True)
    auto_categorized = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Transaction {self.name} - ₹{self.amount}>"


# ------------------------------------------------------------
# 🏷️ CATEGORY MODEL
# ------------------------------------------------------------
class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)

    def __repr__(self):
        return f"<Category {self.name}>"


# ------------------------------------------------------------
# 🎯 GOAL MODEL
# ------------------------------------------------------------
class Goal(db.Model):
    __tablename__ = "goals"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    target_amount = db.Column(db.Numeric(12, 2), nullable=False)
    saved_amount = db.Column(db.Numeric(12, 2), default=0.0)
    duration_months = db.Column(db.Integer, nullable=True)
    start_date = db.Column(db.Date, default=datetime.utcnow)
    ai_suggestion = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Goal {self.name} - Target ₹{self.target_amount}>"

    # ✅ Utility property for progress tracking
    @property
    def progress(self):
        if not self.target_amount or self.target_amount == 0:
            return 0.0
        return round(float(self.saved_amount) / float(self.target_amount) * 100, 2)


# ------------------------------------------------------------
# 📊 FORECAST MODEL (for AI prediction storage)
# ------------------------------------------------------------
class Forecast(db.Model):
    __tablename__ = "forecasts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    model = db.Column(db.String(100), nullable=False)
    forecast_json = db.Column(db.JSON, nullable=True)

    def __repr__(self):
        return f"<Forecast {self.model} at {self.generated_at}>"
