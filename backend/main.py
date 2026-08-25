from __init__ import create_app, socketio
from models import db
from flask import send_from_directory, request
import os

app = create_app()


@app.route('/uploads/<path:filename>')
def a(filename):
    uploads_dir = os.path.join(app.root_path, 'uploads')
    return send_from_directory(uploads_dir, filename)


@app.route("/downloads/mac-agent", methods=["GET"])
def download_mac_agent():
    downloads_dir = os.path.join(app.root_path, "downloads")
    return send_from_directory(
        downloads_dir,
        "SRSP.exe",
        as_attachment=True,
        download_name="Mac-Agent-Setup-1.0.0.exe"
    )


if __name__ == '__main__':
    port = int(os.getenv("FLASK_PORT", 5000))

    # ⚠️ db.create_all() ne doit tourner qu'une seule fois (voir point 2 ci-dessous)
    with app.app_context():
        db.create_all()
        print(f"Tables créées avec succès ! (instance port {port})")

    socketio.run(
        app,
        host="0.0.0.0",
        port=port,
        debug=False,
        use_reloader=False,
    )