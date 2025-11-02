from extensions import db
from datetime import datetime

# ------------------------------------------------------------
# 👤 USER MODEL
# ------------------------------------------------------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    picture = db.Column(db.String(255))  # ✅ For Google OAuth
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    transactions = db.relationship("Transaction", backref="user", lazy=True)
    goals = db.relationship("Goal", backref="user", lazy=True)
    forecasts = db.relationship("Forecast", backref="user", lazy=True)

    def __repr__(self):
        return f"<User {self.email}>"


# ------------------------------------------------------------
# 💸 TRANSACTION MODEL
# ------------------------------------------------------------
class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    name = db.Column(db.String(255))
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.String(100))
    auto_categorized = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Transaction {self.name} - ₹{self.amount}>"


# ------------------------------------------------------------
# 🏷️ CATEGORY MODEL
# ------------------------------------------------------------
class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True)

    def __repr__(self):
        return f"<Category {self.name}>"


# ------------------------------------------------------------
# 🎯 GOAL MODEL
# ------------------------------------------------------------
class Goal(db.Model):
    __tablename__ = "goals"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(255))
    target_amount = db.Column(db.Numeric(12, 2))
    saved_amount = db.Column(db.Numeric(12, 2), default=0.0)  # ✅ unified name
    duration_months = db.Column(db.Integer)
    start_date = db.Column(db.Date, default=datetime.utcnow)
    ai_suggestion = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Goal {self.name} - Target ₹{self.target_amount}>"

    # ✅ Utility property for cleaner code
    @property
    def progress(self):
        if not self.target_amount or self.target_amount == 0:
            return 0
        return float(self.saved_amount) / float(self.target_amount) * 100


# ------------------------------------------------------------
# 📊 FORECAST MODEL (for AI prediction storage)
# ------------------------------------------------------------
class Forecast(db.Model):
    __tablename__ = "forecasts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    model = db.Column(db.String(100))
    forecast_json = db.Column(db.JSON)

    def __repr__(self):
        return f"<Forecast {self.model} at {self.generated_at}>"
