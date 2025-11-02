# app.py
from flask import Flask, session
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from extensions import db, jwt, oauth  # ✅ shared singletons imported here
from config import Config
import os

migrate = Migrate()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Secret key for session-based login (Google OAuth + AI features)
    app.secret_key = app.config.get("SECRET_KEY", "supersecret-key")

    # ✅ Initialize all extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    oauth.init_app(app)

    # ✅ CORS setup for both local & production frontends
    CORS(
        app,
        supports_credentials=True,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                    "https://finvision-blond.vercel.app",  # ✅ Production frontend
                ]
            }
        },
    )

    # ✅ Register API routes blueprint
    from routes import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")

    # ✅ Basic health route
    @app.route("/health")
    def health():
        return {
            "status": "ok",
            "ai_routes": True,
            "auth": True,
            "db": True,
            "cors": True,
        }

    # ✅ Session test endpoint (for debugging Google OAuth)
    @app.route("/session")
    def check_session():
        return {
            "user_id": session.get("user_id"),
            "jwt_token": bool(session.get("jwt_token")),
        }

    # ✅ Auto-create tables if DB is empty (for Render deployment)
    with app.app_context():
        try:
            from models import User, Expense, Transaction  # Adjust if more models
            db.create_all()
            print("✅ Database tables verified/created successfully.")
        except Exception as e:
            print(f"⚠️ Database initialization failed: {e}")

    return app


# ✅ Create app instance for Gunicorn
app = create_app()

if __name__ == "__main__":
    # ✅ Use Render’s assigned port, fallback to 5000 locally
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
