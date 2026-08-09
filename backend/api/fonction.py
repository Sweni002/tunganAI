import os
import cv2
import numpy as np
import warnings
from src.anti_spoof_predict import AntiSpoofPredict
from src.generate_patches import CropImage
from src.utility import parse_model_name
from src.default_config import get_default_config

warnings.filterwarnings("ignore")
conf = get_default_config()

# Répertoire contenant les modèles SilentFace
MODEL_DIR = "./resources/anti_spoof_models"


def predict_spoof(image_path, device_id=0):
    """
    📌 Analyse une image et retourne si c'est un vrai visage ou un spoof/fake.

    Retour :
        {
          "label": "real" ou "fake",
          "score": float
        }
    """

    # Vérifier que l'image existe
    if not os.path.exists(image_path):
        return {"error": "Image not found"}

    # Charger l'image
    image = cv2.imread(image_path)
    if image is None:
        return {"error": "Unable to load image"}

    # Initialisation SilentFace
    model_test = AntiSpoofPredict(device_id)
    image_cropper = CropImage()

    # Détection du visage
    bbox = model_test.get_bbox(image)
    if bbox is None:
        return {"error": "No face detected"}

    prediction = np.zeros((1, conf.num_classes))

    # Parcourir les modèles du dossier
    for model_name in os.listdir(MODEL_DIR):
        model_path = os.path.join(MODEL_DIR, model_name)

        h_input, w_input, model_type, scale = parse_model_name(model_name)

        params = {
            "org_img": image,
            "bbox": bbox,
            "scale": scale,
            "out_w": w_input,
            "out_h": h_input,
            "crop": True,
        }
        if scale is None:
            params["crop"] = False

        # Générer le patch
        patch = image_cropper.crop(**params)

        # Prédiction
        prediction += model_test.predict(patch, model_path)

    # Résultat global
    label_index = np.argmax(prediction)
    score = float(prediction[0][label_index])

    if label_index == 1:
        return {"label": "fake", "score": score}
    else:
        return {"label": "real", "score": score}

image_path = "./img/3.jpeg"
result = predict_spoof(image_path)
print(result)



