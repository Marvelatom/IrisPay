from flask import Flask, jsonify, request
import joblib  # For loading the model
import numpy as np  # If you need NumPy for data manipulation

app = Flask(__name__)

# Load the trained model once when the server starts
model = joblib.load('template_db.pkl')  # Ensure the correct path to your model

@app.route('/')
def home():
    return "Welcome to the Iris Recognition Model API!"

@app.route('/predict', methods=['POST'])
def predict():
    # Ensure that the incoming data is in the expected format
    data = request.get_json()

    # Extract the necessary features from the request (e.g., iris image, other inputs)
    # For this example, assuming the request contains an iris image as a base64 encoded string
    if 'iris_image' not in data:
        return jsonify({"error": "No iris image provided!"}), 400

    # You would need to process the image to match the model input format.
    # For example, if your model takes a numpy array of pixel values:
    iris_image_data = np.array(data['iris_image'])  # This depends on your image format

    # Run inference on the model
    try:
        prediction = model.predict([iris_image_data])  # Adjust based on model input shape
        return jsonify({"prediction": prediction.tolist()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
