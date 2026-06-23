import os
from app import create_app
from app.extensions import db

app = create_app()


@app.cli.command("init-db")
def init_db():
    """Create all database tables. Run with: flask --app run.py init-db"""
    with app.app_context():
        db.create_all()
        print("Database tables created successfully.")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
