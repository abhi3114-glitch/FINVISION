import os
from dotenv import load_dotenv

# ✅ Always locate .env file from project root
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")

if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)
    print(f"✅ Loaded .env from: {ENV_PATH}")
else:
    print(f"❌ .env not found at: {ENV_PATH}")

class Config:
    # ------------------------------------------------------------
    # 🔐 Security & Core
    # ------------------------------------------------------------
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me-now")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'smart_expense.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ------------------------------------------------------------
    # 🌐 Frontend Connection
    # ------------------------------------------------------------
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

   
    # ------------------------------------------------------------
    # 🔑 Google OAuth Setup
    # ------------------------------------------------------------
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

    # Google OAuth Redirect URI — should match your Google Cloud Console
    GOOGLE_REDIRECT_URI = os.getenv(
        "GOOGLE_REDIRECT_URI", "http://127.0.0.1:5000/api/auth/callback"
    )

    # ------------------------------------------------------------
    # 🧠 JWT Authentication
    # ------------------------------------------------------------
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    JWT_TOKEN_LOCATION = ["headers", "cookies"]
    JWT_COOKIE_SECURE = False  # ✅ Set True only in production (HTTPS)
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 900))  # 15 min
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 604800))  # 7 days


print("🔗 DATABASE_URL:", os.getenv("DATABASE_URL"))
print("🔑 GOOGLE_CLIENT_ID Loaded:", bool(os.getenv("GOOGLE_CLIENT_ID")))
