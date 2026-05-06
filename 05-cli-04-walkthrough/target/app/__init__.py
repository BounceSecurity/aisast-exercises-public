from flask import Flask


def create_app():
    app = Flask(__name__)
    from app.routes.users import users_bp
    from app.routes.products import products_bp
    from app.routes.reports import reports_bp

    app.register_blueprint(users_bp, url_prefix="/users")
    app.register_blueprint(products_bp, url_prefix="/products")
    app.register_blueprint(reports_bp, url_prefix="/reports")

    return app
