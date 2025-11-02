# app.py
from flask import Flask, session
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from extensions import db, jwt, oauth  # ✅ shared singletons imported here
from config import Config

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

    # ✅ CORS setup for local React frontend
    CORS(
        app,
        supports_credentials=True,
        resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
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

    return app


if __name__ == "__main__":
    app = create_app()

    # ✅ Debug mode for development
    # Set host=0.0.0.0 if you plan to test on mobile via LAN
    app.run(debug=True, host="127.0.0.1", port=5000)
