from inference_sdk import InferenceHTTPClient
import os

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_MODEL_ID = "face-covering/2"

_roboflow_client = None


def get_roboflow_client():
    """Instancie le client une seule fois (évite de le recréer à chaque requête)."""
    global _roboflow_client
    if _roboflow_client is None:
        if not ROBOFLOW_API_KEY:
            raise RuntimeError("ROBOFLOW_API_KEY non configurée côté serveur")
        _roboflow_client = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=ROBOFLOW_API_KEY,
        )
    return _roboflow_client
