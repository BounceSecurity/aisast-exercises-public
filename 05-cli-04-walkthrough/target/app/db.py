"""Tiny in-memory stub for the course exercise. The real app would use
a real driver — sqlite3, psycopg2, etc. The shape of `db.execute(sql,
params=())` is what matters for the Semgrep rule."""


class _DB:
    def execute(self, sql, params=()):
        # In real code this would dispatch to a driver. The signature
        # is what we care about: SQL string + optional params tuple.
        print("[db]", sql, params)
        return []


db = _DB()
