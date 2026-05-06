from flask import Blueprint, request

from app.db import db

users_bp = Blueprint("users", __name__)


def build_filter_unsafe(column, value):
    # BAD: value is concatenated into the SQL string.
    return f"WHERE {column} = '{value}'"


@users_bp.get("/search")
def search_users():
    # BAD: tainted value flows through build_filter_unsafe (string
    # concat) into db.execute().
    name = request.args.get("name", "")
    where = build_filter_unsafe("name", name)
    return db.execute(f"SELECT * FROM users {where}")
