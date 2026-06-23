import os
from flask import Flask, jsonify, send_from_directory
from app.config import Config
from app.extensions import db, jwt, cors


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Database: use the platform-provided connection URL when present
    # (Render -> DATABASE_URL, Railway MySQL -> MYSQL_URL/DATABASE_URL);
    # otherwise fall back to the local MySQL URI from Config/.env.
    database_url = os.environ.get("DATABASE_URL") or os.environ.get("MYSQL_URL")
    if database_url:
        # Normalize driver prefixes so SQLAlchemy uses an installed driver:
        #  - Render Postgres gives postgres://  -> needs postgresql://
        #  - Railway MySQL gives bare mysql://   -> defaults to missing MySQLdb, force PyMySQL
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        elif database_url.startswith("mysql://"):
            database_url = database_url.replace("mysql://", "mysql+pymysql://", 1)
        app.config["SQLALCHEMY_DATABASE_URI"] = database_url

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    # Allowed CORS origins: the deployed Vercel frontend + the configured
    # FRONTEND_URL (dynamic, e.g. set on Railway) + local Vite dev ports.
    allowed_origins = list({
        app.config["FRONTEND_URL"],
        "https://shivora-ecommerce.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174",
    })
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
    )

    # Ensure upload folders exist
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["REVIEW_UPLOAD_FOLDER"], exist_ok=True)

    # Import models so SQLAlchemy is aware of them
    from app.models import user, category, product, cart, wishlist, order, order_item, review, address, coupon, return_request  # noqa: F401

    # On a hosted DB (Render Postgres / Railway MySQL), auto-create tables.
    # Local dev (no platform URL) uses the SQL migrations instead.
    with app.app_context():
        if os.environ.get("DATABASE_URL") or os.environ.get("MYSQL_URL"):
            db.create_all()
            print("Database tables created via create_all()")

    # Register blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.product_routes import product_bp
    from app.routes.category_routes import category_bp
    from app.routes.cart_routes import cart_bp
    from app.routes.wishlist_routes import wishlist_bp
    from app.routes.order_routes import order_bp
    from app.routes.user_routes import user_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.review_routes import review_bp
    from app.routes.address_routes import address_bp
    from app.routes.coupon_routes import coupon_bp, admin_coupon_bp
    from app.routes.return_routes import return_bp, admin_return_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(product_bp, url_prefix="/api/products")
    app.register_blueprint(category_bp, url_prefix="/api/categories")
    app.register_blueprint(cart_bp, url_prefix="/api/cart")
    app.register_blueprint(wishlist_bp, url_prefix="/api/wishlist")
    app.register_blueprint(order_bp, url_prefix="/api/orders")
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(review_bp, url_prefix="/api/reviews")
    app.register_blueprint(address_bp, url_prefix="/api/addresses")
    app.register_blueprint(coupon_bp, url_prefix="/api/coupons")
    app.register_blueprint(admin_coupon_bp, url_prefix="/api/admin/coupons")
    app.register_blueprint(return_bp, url_prefix="/api/orders")
    app.register_blueprint(admin_return_bp, url_prefix="/api/admin/returns")

    # Serve uploaded product images
    @app.route("/uploads/products/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # Serve uploaded review images
    @app.route("/uploads/reviews/<path:filename>")
    def uploaded_review_file(filename):
        return send_from_directory(app.config["REVIEW_UPLOAD_FOLDER"], filename)

    # Health check
    @app.route("/api/health")
    def health_check():
        return jsonify({"status": "ok", "message": "API is running"}), 200

    # ---------------- Error Handlers ----------------
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request", "message": str(e)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Unauthorized", "message": "Authentication required"}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden", "message": "You do not have permission"}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found", "message": "Resource not found"}), 404

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({"error": "Payload too large", "message": "File exceeds 5MB limit"}), 413

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error", "message": "Something went wrong"}), 500

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Token expired", "message": "Please log in again"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"error": "Invalid token", "message": "Please log in again"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"error": "Missing token", "message": "Authentication token is required"}), 401

    return app
