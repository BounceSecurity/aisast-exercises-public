from flask import Blueprint, request

from app.db import db

products_bp = Blueprint("products", __name__)


@products_bp.get("/search")
def search_products():
    # OK: parameterised. The tainted `name` only reaches db.execute
    # as a bound parameter — it never enters the SQL string.
    name = request.args.get("name", "")
    return db.execute("SELECT * FROM products WHERE name = ?", (name,))
