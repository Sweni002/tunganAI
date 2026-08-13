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
    downloads_dir = os.path.join(
        app.root_path,
        "downloads"
    )

    return send_from_directory(
        downloads_dir,
        "SRSP.exe",
        as_attachment=True,
        download_name="Mac-Agent-Setup-1.0.0.exe"
    )
    

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Tables créées avec succès !")

    # Plus de ssl_context : le serveur écoute en HTTP simple
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=False,
        use_reloader=False,  # évite le double démarrage du scheduler
    )