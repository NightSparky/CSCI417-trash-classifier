from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import joblib
import io

cnn_model = load_model("backend/models/cnn_model.keras")
log_model = joblib.load("backend/models/log_model.pkl")
rf_model = joblib.load("backend/models/rf_model.pkl")

class_labels = ["metal", "organic", "paper", "plastic"]

app = FastAPI()

# obligatory middleware for fastAPI more or less.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],        
    allow_headers=["*"],        # allow EVERYTHINGGGG
)

@app.post("/classify")
async def classify(image_file: UploadFile = File(...)):
    # Load image
    img = image.load_img(io.BytesIO(await image_file.read()), target_size=(128,128))
    print("File read into memory")
    img_array = image.img_to_array(img) / 255.0 # turns the image into a NumPy array
    img_array = np.expand_dims(img_array, axis=0)  # batch dimension so we can pass the image to the prediction models

    cnn_probs = cnn_model.predict(img_array)

    X_flat = img_array.reshape(1, -1) # To flatten the image for the sake of the log and rf models

    # --- LR & RF predictions ---
    log_probs = log_model.predict_proba(X_flat)
    rf_probs = rf_model.predict_proba(X_flat)

    # The Ensemble
    cnn_conf = np.max(cnn_probs, axis=1)
    mask = cnn_conf < 0.6
    ensemble_preds = np.argmax(cnn_probs, axis=1)  # start with CNN

    if mask[0]:  # if CNN is not confident enough, we start consulting the rest of the ensemble.
        ensemble_probs = 0.6*cnn_probs + 0.2*log_probs + 0.2*rf_probs
        ensemble_preds[0] = int(np.argmax(ensemble_probs))

    predicted_class = class_labels[int(ensemble_preds[0])]
    confidence = float(np.max(cnn_probs)) 

    # Return all probabilities to showcase on the page.
    all_probs = {label: float(prob) for label, prob in zip(class_labels, cnn_probs[0])}

    return {
        "predicted_class": predicted_class,
        "confidence": confidence,
        "all_probs": all_probs
    }