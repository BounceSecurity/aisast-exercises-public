from flask import Blueprint, request

from app.db import db

reports_bp = Blueprint("reports", __name__)


@reports_bp.get("/by-month")
def report_by_month():
    # OK: value is cast to int before being interpolated. `int()`
    # acts as a sanitizer — non-numeric input raises ValueError
    # before it can reach the SQL string.
    month = int(request.args.get("month", "1"))
    return db.execute(f"SELECT * FROM sales WHERE month = {month}")


@reports_bp.get("/by-region")
def report_by_region():
    # BAD: direct concatenation of a request value into SQL.
    region = request.args.get("region", "")
    return db.execute("SELECT * FROM sales WHERE region = '" + region + "'")
