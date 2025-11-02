# extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from authlib.integrations.flask_client import OAuth

# ------------------------------------------------------------
# ✅ Shared Extension Instances
# ------------------------------------------------------------

# Database (for models and transactions)
db = SQLAlchemy()

# JWT Manager (for secure login tokens)
jwt = JWTManager()

# OAuth (for Google authentication)
oauth = OAuth()
