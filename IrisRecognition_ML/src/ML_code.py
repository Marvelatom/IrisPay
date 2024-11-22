import os
import pickle
from extractandenconding import extractFeature
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score
import argparse
from time import time
import numpy as np

# Load features from a dataset
def load_dataset(directory):
    X, y = [], []
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        if os.path.isfile(file_path):
            # Extract features for each image in the dataset
            template, mask, label = extractFeature(file_path)
            if template is not None and mask is not None:
                # Use the extracted template as features and the filename (or other criteria) as labels
                X.append(template.flatten())  # Assuming template is the feature
                y.append(label)
    return np.array(X), np.array(y)

# Train a classifier
def train_classifier(X, y):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = SVC(kernel='linear', probability=True)  # Support Vector Classifier
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    print(f"Training accuracy: {accuracy_score(y_test, y_pred)}")
    
    # Save the trained model for later use
    with open('image_classifier.pkl', 'wb') as f:
        pickle.dump(model, f)

    return model

# Load the classifier
def load_classifier(model_path='image_classifier.pkl'):
    with open(model_path, 'rb') as f:
        return pickle.load(f)

# Predict using the classifier
def predict_image(model, template):
    template = template.flatten().reshape(1, -1)  # Flatten and reshape for prediction
    prediction = model.predict(template)
    probabilities = model.predict_proba(template)
    
    return prediction[0], probabilities[0]

# Main function for verification
def main():
    parser = argparse.ArgumentParser(description="Train or verify image matching using a machine learning model.")
    parser.add_argument("--filename", type=str, required=True, help="Path to the image file to verify.")
    parser.add_argument("--template_dir", type=str, default="./templates/CASIA1/", help="Path to the directory containing template files.")
    parser.add_argument("--threshold", type=float, default=0.37, help="Threshold for matching.")
    parser.add_argument("--train", action='store_true', help="Train the model with template features.")
    args = parser.parse_args()

    start = time()

    # If training is specified
    if args.train:
        print(f"Loading dataset from: {args.template_dir}")
        X, y = load_dataset(args.template_dir)
        print(f"Training model with {len(X)} samples.")
        train_classifier(X, y)
        print(f"Model trained and saved as 'image_classifier.pkl'")
    else:
        # Load the pre-trained model
        model = load_classifier()

        # Verify file existence
        if not os.path.isfile(args.filename):
            raise FileNotFoundError(f"The file '{args.filename}' does not exist or cannot be accessed.")
        
        print(f'\nVerifying image: {args.filename}\n')
        
        # Extract features from the input image
        template, mask, filename = extractFeature(args.filename)
        if template is None or mask is None:
            raise ValueError("Feature extraction returned None for template or mask.")

        # Predict the matching class using the ML model
        predicted_class, probabilities = predict_image(model, template)
        
        if max(probabilities) < args.threshold:
            print(f"No reliable match found. Best probability: {max(probabilities):.2f}")
        else:
            print(f"Matched template: {predicted_class} with confidence {max(probabilities):.2f}")

    end = time()
    print(f"\nTotal time: {end - start:.2f} seconds\n")

if __name__ == "__main__":
    main()
