# seed_data.py
from app import create_app
from extensions import db
from models import User, Transaction, Goal
from datetime import datetime, timedelta

app = create_app()

with app.app_context():
    # 🔄 Clear old data
    db.drop_all()
    db.create_all()

    print("🧹 Database cleared & recreated!")

    # 👤 Create demo user
    user = User(
        name="Abhishek Pratap Singh Chauhan",
        email="demo@finvision.ai",
        picture="https://avatars.githubusercontent.com/u/9919?v=4"
    )
    db.session.add(user)
    db.session.commit()
    print("👤 Added demo user:", user.name)

    # 💸 Add sample transactions
    transactions = [
        Transaction(user_id=user.id, date=datetime.utcnow().date() - timedelta(days=3),
                    name="Zomato - Dinner", amount=450.00, category="Food"),
        Transaction(user_id=user.id, date=datetime.utcnow().date() - timedelta(days=2),
                    name="Netflix Subscription", amount=499.00, category="Subscriptions"),
        Transaction(user_id=user.id, date=datetime.utcnow().date() - timedelta(days=5),
                    name="Amazon Purchase - Headphones", amount=2199.00, category="Shopping"),
        Transaction(user_id=user.id, date=datetime.utcnow().date() - timedelta(days=7),
                    name="Uber Ride", amount=230.00, category="Travel"),
        Transaction(user_id=user.id, date=datetime.utcnow().date() - timedelta(days=10),
                    name="Electricity Bill", amount=1450.00, category="Bills"),
    ]
    db.session.add_all(transactions)

    # 🎯 Add sample goals
    goals = [
        Goal(user_id=user.id, name="Buy a Laptop", target_amount=60000,
             duration_months=6, start_date=datetime.utcnow().date(), current_saved=15000),
        Goal(user_id=user.id, name="Trip to Goa", target_amount=25000,
             duration_months=3, start_date=datetime.utcnow().date(), current_saved=8000),
        Goal(user_id=user.id, name="Emergency Fund", target_amount=100000,
             duration_months=12, start_date=datetime.utcnow().date(), current_saved=20000),
    ]
    db.session.add_all(goals)

    db.session.commit()
    print("💸 Added sample transactions and goals!")

    print("✅ Database seeded successfully with demo data.")
