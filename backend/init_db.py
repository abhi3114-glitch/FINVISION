from app import db, create_app
from models import User, Transaction, Goal  # ✅ Import models before creating tables

app = create_app()

with app.app_context():
    print("🔄 Creating all database tables...")
    db.create_all()
    print("✅ Database initialized successfully!")
