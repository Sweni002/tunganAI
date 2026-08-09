import os
import sys
import cv2
import numpy as np
import warnings
import threading

# ---------------------------------------------------------------------------
# ⚠️ Nom exact du dossier réel (vérifié via `ls`) : majuscules + tirets,
# pas "silent_face_anti_spoofing". Sur Windows la casse est souvent tolérée,
# mais un mauvais nom de dossier fait quand même échouer os.path.join / isdir
# si les tirets ne correspondent pas.
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # .../backend/api
SPOOF_PATH = os.path.join(BASE_DIR, "..", "Silent-Face-Anti-Spoofing-master")
SPOOF_PATH = os.path.abspath(SPOOF_PATH)

if not os.path.isdir(SPOOF_PATH):
    raise FileNotFoundError(
        f"Dossier Silent-Face-Anti-Spoofing introuvable : {SPOOF_PATH}"
    )

# insert(0, ...) plutôt que append : garantit que le "src" de ce dossier est
# résolu en priorité, même si un autre dossier "src" existe ailleurs dans le
# projet (ex: backend/src/) et serait sinon trouvé en premier dans sys.path.
sys.path.insert(0, SPOOF_PATH)

from src.anti_spoof_predict import AntiSpoofPredict
from src.generate_patches import CropImage
from src.utility import parse_model_name
from src.default_config import get_default_config

warnings.filterwarnings("ignore")
conf = get_default_config()

MODEL_DIR = os.path.join(SPOOF_PATH, "resources", "anti_spoof_models")
MODEL_DIR = os.path.abspath(MODEL_DIR)

if not os.path.isdir(MODEL_DIR):
    raise FileNotFoundError(f"Dossier des modèles introuvable : {MODEL_DIR}")


def _create_anti_spoof_predict(device_id=0):
    """
    AntiSpoofPredict charge son détecteur de visage Caffe avec un chemin
    RELATIF codé en dur dans la lib ("./resources/detection_model/deploy.prototxt"),
    résolu par rapport au cwd du PROCESSUS, pas par rapport à ce fichier.
    On se place temporairement dans SPOOF_PATH pour que ce chemin relatif
    pointe au bon endroit, puis on revient au cwd d'origine.
    """
    original_cwd = os.getcwd()
    try:
        os.chdir(SPOOF_PATH)
        return AntiSpoofPredict(device_id)
    finally:
        os.chdir(original_cwd)


# ---------------------------------------------------------------------------
# PERF : tout ce qui suit est chargé UNE SEULE FOIS au démarrage du process
# (import du module), au lieu d'être recréé à chaque appel de predict_spoof.
# C'était le principal goulot d'étranglement : recharger le détecteur Caffe
# + relister le dossier de modèles à chaque pointage coûte plusieurs centaines
# de ms, voire plus, à chaque requête.
# ---------------------------------------------------------------------------
model_test = _create_anti_spoof_predict(device_id=0)
image_cropper = CropImage()

# Liste des modèles anti-spoof précalculée une seule fois (évite un
# os.listdir(MODEL_DIR) à chaque appel)
MODEL_FILES = sorted(os.listdir(MODEL_DIR))

# Verrou : les objets OpenCV DNN ne sont pas garantis thread-safe pour des
# appels concurrents à predict()/get_bbox() sur la même instance. Si Flask
# sert plusieurs requêtes en parallèle (threads), ce lock sérialise l'accès
# au modèle partagé plutôt que de risquer une corruption d'état interne.
_predict_lock = threading.Lock()


def predict_spoof(image_path=None, image=None, device_id=0):
    """
    📌 Analyse une image et retourne si c'est un vrai visage ou un spoof/fake.

    Accepte SOIT :
      - image_path : chemin vers un fichier sur disque (comportement d'origine)
      - image      : image déjà décodée en mémoire (np.ndarray BGR), pour éviter
                     une relecture disque si l'appelant a déjà les bytes
                     (ex: cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR))

    Retour :
        {
          "success": bool,
          "result": "Real" ou "Fake",
          "score": float
        }
        ou {"error": "..."} en cas de problème.
    """
    if image is None:
        if not image_path:
            return {"error": "Aucune image fournie"}

        image_path = os.path.abspath(image_path)
        if not os.path.exists(image_path):
            return {"error": "Image not found"}

        image = cv2.imread(image_path)
        if image is None:
            return {"error": "Unable to load image"}

    # PERF : model_test et image_cropper sont réutilisés (chargés une seule
    # fois au niveau module), plus recréés à chaque appel.
    with _predict_lock:
        bbox = model_test.get_bbox(image)
        if bbox is None:
            return {"error": "No face detected"}

        prediction = np.zeros((1, conf.num_classes))

        for model_name in MODEL_FILES:
            model_path = os.path.join(MODEL_DIR, model_name)

            h_input, w_input, model_type, scale = parse_model_name(model_name)

            params = {
                "org_img": image,
                "bbox": bbox,
                "scale": scale,
                "out_w": w_input,
                "out_h": h_input,
                "crop": scale is not None,
            }

            patch = image_cropper.crop(**params)

            prediction += model_test.predict(patch, model_path)

    label_index = np.argmax(prediction)
    score = float(prediction[0][label_index])

    if label_index == 1:
        return {"success": True, "result": "Fake", "score": score}
    else:
        return {"success": True, "result": "Real", "score": score}


if __name__ == "__main__":
    # Chemin absolu construit depuis ce fichier : fiable quel que soit
    # le répertoire depuis lequel ce script est lancé
    test_image_path = os.path.join(BASE_DIR, "img", "4.jpg")
    result = predict_spoof(image_path=test_image_path)
    print(result)