from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse, unquote
import json
import sqlite3
import uuid
from datetime import datetime


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = Path(__file__).resolve().parent / "cognipath.db"


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Active',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS profiles (
                email TEXT PRIMARY KEY,
                phone TEXT DEFAULT '',
                location TEXT DEFAULT '',
                bio TEXT DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS career_inputs (
                id TEXT PRIMARY KEY,
                candidate TEXT NOT NULL,
                source TEXT NOT NULL,
                readiness INTEGER NOT NULL DEFAULT 3,
                input_text TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                total INTEGER NOT NULL,
                readiness INTEGER NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )
        count = conn.execute("SELECT COUNT(*) AS c FROM career_inputs").fetchone()["c"]
        if count == 0:
            rows = [
                ("Aarav Sharma", "Resume", 5, "Python SQL analytics dashboard project leadership communication agile", "2026-07-01"),
                ("Priya Nair", "Skill Gap", 2, "Cloud security missing beginner database training needed", "2026-07-02"),
                ("Riya Kapoor", "Resume", 4, "JavaScript API design testing data project machine learning", "2026-07-03"),
                ("Kabir Mehta", "Career Goal", 3, "Product analytics communication basic leadership improve roadmap", "2026-07-04"),
                ("Neha Das", "Skill Gap", 1, "Limited cloud experience missing SQL weak deployment skills", "2026-07-05"),
                ("Isha Rao", "Resume", 5, "Machine learning research Python data visualization database project", "2026-07-06"),
            ]
            conn.executemany(
                "INSERT INTO career_inputs (id, candidate, source, readiness, input_text, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                [(new_id(), *row) for row in rows],
            )


def new_id():
    return "cp_" + uuid.uuid4().hex[:16]


def now():
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def user_to_dict(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "question": row["question"],
        "status": row["status"],
        "createdAt": row["created_at"],
    }


def input_to_dict(row):
    return {
        "id": row["id"],
        "customer": row["candidate"],
        "source": row["source"],
        "rating": row["readiness"],
        "text": row["input_text"],
        "createdAt": row["created_at"],
    }


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if not path.startswith("/api/"):
            if path == "/":
                self.path = "/index.html"
            return super().do_GET()

        if path == "/api/health":
            return self.json({"ok": True, "database": str(DB_PATH)})
        if path == "/api/users":
            with connect() as conn:
                users = [user_to_dict(r) for r in conn.execute("SELECT * FROM users ORDER BY created_at DESC")]
            return self.json(users)
        if path == "/api/career-inputs":
            with connect() as conn:
                rows = [input_to_dict(r) for r in conn.execute("SELECT * FROM career_inputs ORDER BY created_at DESC")]
            return self.json(rows)
        if path == "/api/profile":
            email = parse_qs(urlparse(self.path).query).get("email", [""])[0].lower()
            with connect() as conn:
                row = conn.execute("SELECT * FROM profiles WHERE email = ?", (email,)).fetchone()
            return self.json(dict(row) if row else {"email": email, "phone": "", "location": "", "bio": ""})
        return self.not_found()

    def do_POST(self):
        path = urlparse(self.path).path
        data = self.body()

        if path == "/api/auth/register":
            required = ["name", "email", "password", "question", "answer"]
            if any(not data.get(k) for k in required):
                return self.error("Please complete every required field.", 400)
            try:
                with connect() as conn:
                    conn.execute(
                        "INSERT INTO users (id, name, email, password, question, answer, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        (new_id(), data["name"].strip(), data["email"].lower().strip(), data["password"], data["question"], data["answer"].lower().strip(), "Active", now()),
                    )
                    conn.execute(
                        "INSERT OR REPLACE INTO profiles (email, phone, location, bio) VALUES (?, '', 'Bengaluru', ?)",
                        (data["email"].lower().strip(), "Career intelligence user building a personalized growth path with CogniPath."),
                    )
                    user = conn.execute("SELECT * FROM users WHERE email = ?", (data["email"].lower().strip(),)).fetchone()
                return self.json({"user": user_to_dict(user)})
            except sqlite3.IntegrityError:
                return self.error("An account already exists for this email.", 409)

        if path == "/api/auth/login":
            with connect() as conn:
                user = conn.execute("SELECT * FROM users WHERE email = ?", (data.get("email", "").lower(),)).fetchone()
            if not user or user["password"] != data.get("password"):
                return self.error("Invalid email or password.", 401)
            return self.json({"user": user_to_dict(user)})

        if path == "/api/auth/forgot-password":
            email = data.get("email", "").lower()
            with connect() as conn:
                user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
                if not user:
                    return self.error("No account found for this email.", 404)
                if user["answer"] != data.get("answer", "").lower().strip():
                    return self.error("Security answer does not match.", 401)
                conn.execute("UPDATE users SET password = ? WHERE email = ?", (data.get("password", ""), email))
            return self.json({"ok": True})

        if path == "/api/career-inputs":
            items = data.get("items", [])
            saved = []
            with connect() as conn:
                for item in items:
                    row = (
                        item.get("id") or new_id(),
                        item.get("customer") or item.get("candidate") or "Candidate",
                        item.get("source") or "Resume",
                        int(item.get("rating") or item.get("readiness") or 3),
                        item.get("text") or item.get("input_text") or "",
                        item.get("createdAt") or now()[:10],
                    )
                    if row[4]:
                        conn.execute(
                            "INSERT OR REPLACE INTO career_inputs (id, candidate, source, readiness, input_text, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                            row,
                        )
                        saved.append(row[0])
            return self.json({"ok": True, "saved": len(saved)})

        if path == "/api/reports":
            with connect() as conn:
                conn.execute(
                    "INSERT INTO reports (id, total, readiness, created_at) VALUES (?, ?, ?, ?)",
                    (new_id(), int(data.get("total", 0)), int(data.get("readiness", 0)), now()),
                )
            return self.json({"ok": True})

        return self.not_found()

    def do_PATCH(self):
        path = urlparse(self.path).path
        data = self.body()
        if path == "/api/profile":
            email = data.get("email", "").lower()
            with connect() as conn:
                conn.execute(
                    "INSERT OR REPLACE INTO profiles (email, phone, location, bio) VALUES (?, ?, ?, ?)",
                    (email, data.get("phone", ""), data.get("location", ""), data.get("bio", "")),
                )
                if data.get("name"):
                    conn.execute("UPDATE users SET name = ? WHERE email = ?", (data["name"], email))
            return self.json({"ok": True})
        return self.not_found()

    def do_DELETE(self):
        path = urlparse(self.path).path
        if path.startswith("/api/admin/users/"):
            email = unquote(path.rsplit("/", 1)[-1]).lower()
            with connect() as conn:
                conn.execute("DELETE FROM profiles WHERE email = ?", (email,))
                conn.execute("DELETE FROM users WHERE email = ?", (email,))
            return self.json({"ok": True})
        return self.not_found()

    def body(self):
        length = int(self.headers.get("Content-Length", 0))
        if not length:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {}

    def json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def error(self, message, status):
        self.json({"error": message}, status)

    def not_found(self):
        self.error("Not found", 404)


if __name__ == "__main__":
    init_db()
    server = ThreadingHTTPServer(("127.0.0.1", 8000), Handler)
    print("CogniPath running at http://127.0.0.1:8000")
    print(f"SQLite database: {DB_PATH}")
    server.serve_forever()
