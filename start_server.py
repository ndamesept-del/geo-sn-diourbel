from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Timer
import webbrowser


PROJECT_DIR = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 8000


def open_map():
    webbrowser.open(f"http://{HOST}:{PORT}/")


if __name__ == "__main__":
    handler = partial(SimpleHTTPRequestHandler, directory=PROJECT_DIR)
    server = ThreadingHTTPServer((HOST, PORT), handler)
    Timer(0.8, open_map).start()
    print(f"Carte disponible sur http://{HOST}:{PORT}/")
    print("Fermez cette fenêtre pour arrêter le serveur.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
