from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, session
import os
from mieten import fuehre_mietabgleich_durch
import traceback
from datetime import timedelta, datetime
from io import BytesIO
import openpyxl
from openpyxl.utils import get_column_letter
from openpyxl.comments import Comment
from openpyxl.styles import PatternFill

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
RESULTS_FOLDER = os.path.join(BASE_DIR, "results")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "change-me")

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["RESULTS_FOLDER"] = RESULTS_FOLDER
app.secret_key = os.environ.get("SECRET_KEY", "please-change-me-very-secret")
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(minutes=60)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)


@app.route("/telematik/process", methods=["POST"])
def telematik_process():
    # Platzhalter – identisch wie in services/mieten_server; optional für Oflaz
    try:
        excel = request.files.get("excel")
        if not excel:
            return jsonify({"status": "error", "message": "Excel-Datei fehlt (Feldname: excel)."}), 400
        # Keine spezielle Telematik-Verarbeitung notwendig
        return jsonify({"status": "ok", "message": "Telematik-Endpoint aktiv."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e), "trace": traceback.format_exc()}), 500


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        if email.lower() == ADMIN_EMAIL.lower() and password == ADMIN_PASSWORD:
            session["user_email"] = email
            session.permanent = True
            session["last_activity"] = int(datetime.utcnow().timestamp())
            return redirect(url_for("index"))
        return ("""<!doctype html><html><body>
                   <p>Zugangsdaten ungültig.</p>
                   <a href="/py/login">Zurück</a>
                   </body></html>""", 401)
    if session.get("user_email"):
        return redirect(url_for("index"))
    return """<!doctype html><html><body>
              <form method="post">
                <label>Email: <input name="email" /></label><br/>
                <label>Password: <input name="password" type="password"/></label><br/>
                <button type="submit">Login</button>
              </form>
              </body></html>"""


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/")
def index():
    return """<!doctype html><html><body>
              <h3>Oflaz Mieten-Backend</h3>
              <p>Dieses Backend stellt Programmierschnittstellen bereit.</p>
              </body></html>"""


@app.route("/process", methods=["POST"])
def process():
    excel = request.files.get("excel")
    konto_file = request.files.get("konto")

    if not excel or not konto_file:
        return jsonify({"status": "error", "message": "Bitte Excel (Mieter) und Excel (Kontoauszug) hochladen."}), 400

    excel_path = os.path.join(UPLOAD_FOLDER, excel.filename)
    konto_path = os.path.join(UPLOAD_FOLDER, konto_file.filename)

    excel.save(excel_path)
    konto_file.save(konto_path)

    try:
        result_path = fuehre_mietabgleich_durch(excel_path, konto_path)
        if not result_path or not os.path.exists(result_path):
            return jsonify({"status": "error", "message": "Ergebnisdatei wurde nicht erstellt."}), 500

        download_name = os.path.basename(result_path)
        return jsonify({
            "status": "ok",
            "message": "Mietabgleich abgeschlossen",
            "download": f"/results/{download_name}"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e),
            "trace": traceback.format_exc()
        }), 500


@app.route("/results/<path:filename>")
def download_result(filename):
    file_path = os.path.join(RESULTS_FOLDER, filename)
    if not os.path.exists(file_path):
        return jsonify({"status": "error", "message": "Datei nicht gefunden"}), 404
    return send_from_directory(
        RESULTS_FOLDER,
        filename,
        as_attachment=True,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        download_name=filename
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


