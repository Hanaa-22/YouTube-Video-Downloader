from flask import Flask, render_template, request, jsonify
import os
import yt_dlp as youtube_dl
import threading
import uuid

app = Flask(__name__)

# Dictionnaire pour suivre l'état des tâches
tasks = {}

# Messages d'erreur standardisés
ERROR_MESSAGES = {
    "invalid_url": "Veuillez entrer une URL valide.",
    "download_error": "Une erreur est survenue lors du téléchargement.",
}

# Fonction utilitaire pour valider une URL
def is_valid_url(url):
    return url and (url.startswith("http://") or url.startswith("https://"))

# Route pour valider une URL
@app.route('/validate-url', methods=['POST'])
def validate_url():
    url = request.form.get('url')
    if not is_valid_url(url):
        return jsonify({"message": ERROR_MESSAGES["invalid_url"], "status": "error"})
    return jsonify({"message": "URL valide.", "status": "success"})

# Fonction pour télécharger une vidéo
def download_video(url, folder, filename, task_id):
    try:
        ydl_opts = {
            'outtmpl': os.path.join(folder, filename),
            'format': 'best',
            'noplaylist': True,
        }

        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            total_size = info.get('filesize') or info.get('formats', [{}])[0].get('filesize', 1)

            tasks[task_id]["status"] = "downloading"
            tasks[task_id]["progress"] = 0

            def progress_hook(d):
                if d['status'] == 'downloading':
                    downloaded = d.get('downloaded_bytes', 0)
                    progress = min(int((downloaded / total_size) * 100), 100)
                    tasks[task_id]["progress"] = progress

                if d['status'] == 'finished':
                    tasks[task_id]["progress"] = 100

            ydl_opts['progress_hooks'] = [progress_hook]
            with youtube_dl.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

        tasks[task_id]["status"] = "completed"
        tasks[task_id]["progress"] = 100
    except Exception as e:
        tasks[task_id]["status"] = "error"
        tasks[task_id]["message"] = str(e)

# Route pour lancer un téléchargement
@app.route('/download', methods=['POST'])
def download():
    url = request.form.get('url')
    folder = 'downloads'
    filename = f"{uuid.uuid4()}.mp4"

    if not is_valid_url(url):
        return jsonify({"message": ERROR_MESSAGES["invalid_url"], "status": "error"})

    if not os.path.exists(folder):
        os.makedirs(folder)

    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "pending", "progress": 0}

    # Lancer le téléchargement dans un thread
    threading.Thread(target=download_video, args=(url, folder, filename, task_id)).start()

    return jsonify({"message": "Téléchargement en cours...", "status": "success", "task_id": task_id})

# Route pour suivre l'état du téléchargement
@app.route('/download-status/<task_id>', methods=['GET'])
def download_status(task_id):
    task = tasks.get(task_id)
    if not task:
        return jsonify({"status": "error", "message": "Tâche introuvable."})

    return jsonify(task)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True)
