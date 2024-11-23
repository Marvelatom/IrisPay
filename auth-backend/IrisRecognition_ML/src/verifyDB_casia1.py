import os
import cv2
import numpy as np
import pickle
from extractandenconding import extractFeature, matchingTemplate
from sklearn.svm import SVC
from time import time
import argparse

# Function to load embeddings from .pkl file
def load_embeddings(template_dir):
    with open(os.path.join(template_dir, "template_db.pkl"), 'rb') as f:
        return pickle.load(f)

# Function to check if the template already exists
def template_exists(template_dir, filename):
    basename = os.path.basename(filename).replace('.jpg', '')
    template_file = os.path.join(template_dir, f"{basename}_template.npy")
    return os.path.exists(template_file)

# Function to create a new template if it doesn't exist
def create_new_template(template_dir, filename):
    print(f"Creating a new template for {filename}")
    template, mask, _ = extractFeature(filename)
    basename = os.path.basename(filename).replace('.jpg', '')
    np.save(os.path.join(template_dir, f"{basename}_template.npy"), template)
    np.save(os.path.join(template_dir, f"{basename}_mask.npy"), mask)
    print(f"Template saved for {filename}")
    return template, mask

# Train SVM model using embeddings
def train_model(embeddings, labels):
    X = np.array(list(embeddings.values()))
    y = np.array(labels)

    if X.ndim > 2:
        X = X.reshape(X.shape[0], -1)

    if len(set(y)) < 2:
        raise ValueError("At least two classes are required to train the model.")

    model = SVC(kernel='linear', C=0.5, probability=True)
    model.fit(X, y)

    return model

# Train function to prepare embeddings and labels
def train(args):
    embeddings = {}
    labels = []
    template_files = [
        file for file in os.listdir(args.template_dir)
        if file.endswith('_template.npy')
    ]

    if not template_files:
        raise ValueError("No templates found in the specified directory.")

    for template_file in template_files:
        basename = template_file.replace('_template.npy', '')
        mask_file = os.path.join(args.template_dir, f"{basename}_mask.npy")
        if os.path.exists(mask_file):
            template_path = os.path.join(args.template_dir, template_file)
            embeddings[basename] = np.load(template_path).flatten()
            labels.append(basename)

    # Train the model
    print("Training the model...")
    model = train_model(embeddings, labels)
    model_path = os.path.join(args.template_dir, "svm_model.pkl")
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"Model trained and saved at {model_path}")

# Function to detect eyes in an image
def detect_eyes(image):
    if image is None or not hasattr(image, "shape"):
        return False

    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
    if eye_cascade.empty():
        raise FileNotFoundError("Eye cascade file not found.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    eyes = eye_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=7, minSize=(30, 30))

    if len(eyes) == 0:
        return False

    for (x, y, w, h) in eyes:
        eye_roi = gray[y:y+h, x:x+w]
        sharpness = cv2.Laplacian(eye_roi, cv2.CV_64F).var()

        # Log sharpness to help debug
        print(f"Sharpness: {sharpness}")

        if sharpness < 100:  # Set the threshold for sharpness
            continue  # If the image is too blurry, don't consider it

        if w * h > 1000:  # Check if the detected eye region is sufficiently large
            print(f"Eye detected with sharpness: {sharpness}")
            return True

    return False

# Verify image against existing templates and create new template if necessary
def verify_and_create_template(args):
    # Load the image file and check if it is loaded correctly
    image = cv2.imread(args.filename)
    if image is None:
        raise ValueError(f"Failed to load image: {args.filename}")

    # Check if eyes are detected in the image
    print("Checking for eyes in the image...")
    if not detect_eyes(image):
        print("No iris detected in the image. Verification failed.\n")
        return False

    # Check if template already exists for the image
    if template_exists(args.template_dir, args.filename):
        print(f"Template already exists for {args.filename}. Proceeding with verification.")
        # Extract features for matching
        template, mask, _ = extractFeature(args.filename)
        print("Performing template matching...")
        result = matchingTemplate(template, mask, args.template_dir, args.threshold)
        
        if result == -1:
            print('\tNo registered sample found.')
            print("Iris verification failed.\n")
            # If no match is found, delete the template
            basename = os.path.basename(args.filename).replace('.jpg', '')
            template_file = os.path.join(args.template_dir, f"{basename}_template.npy")
            mask_file = os.path.join(args.template_dir, f"{basename}_mask.npy")
            if os.path.exists(template_file):
                os.remove(template_file)
            if os.path.exists(mask_file):
                os.remove(mask_file)
            print(f"Template for {basename} deleted.")
            return False  # Return False if verification fails
        elif result == 0:
            print('\tNo sample found in the directory.')
            print("Iris verification failed.\n")
            # If no match is found, delete the template
            basename = os.path.basename(args.filename).replace('.jpg', '')
            template_file = os.path.join(args.template_dir, f"{basename}_template.npy")
            mask_file = os.path.join(args.template_dir, f"{basename}_mask.npy")
            if os.path.exists(template_file):
                os.remove(template_file)
            if os.path.exists(mask_file):
                os.remove(mask_file)
            print(f"Template for {basename} deleted.")
            return False  # Return False if verification fails
        else:
            print(f'\tSamples found (in descending order of reliability):')
            for res in result:
                print(f'\t\t{res}')  # Each result on a new line
            print(f"Iris verification successful for {args.filename}. Template is valid.\n")
            return True  # Return True if verification is successful

    else:
        # If template doesn't exist, create a new one
        print("Template doesn't exist. Creating a new template.")
        template, mask = create_new_template(args.template_dir, args.filename)
        
        # Now verify the newly created template
        print(f"Verifying the new template for {args.filename}.")
        result = matchingTemplate(template, mask, args.template_dir, args.threshold)
        
        if result == -1 or result == 0:
            print("Iris verification failed. Deleting the newly created template.\n")
            # Delete the newly created template if verification fails
            basename = os.path.basename(args.filename).replace('.jpg', '')
            template_file = os.path.join(args.template_dir, f"{basename}_template.npy")
            mask_file = os.path.join(args.template_dir, f"{basename}_mask.npy")
            if os.path.exists(template_file):
                os.remove(template_file)
            if os.path.exists(mask_file):
                os.remove(mask_file)
            print(f"Template for {basename} deleted.")
            return False  # Return False if verification fails
        else:
            print(f"Verification successful for {args.filename}. The template is valid.\n")
            return True  # Return True if verification is successful

def main():
    # Argument parser
    parser = argparse.ArgumentParser(description="Train model or verify image against templates.")
    parser.add_argument("--template_dir", type=str, default="D:/Capstone/softaware/IrisRecognition_ML/src/templates/CASIA1/",
                        help="Path to the directory containing template files (default: ./templates/CASIA1/).")
    parser.add_argument("--mode", type=str, choices=['train', 'verify'], default='verify',
                        help="Mode of operation: 'train' to train the model or 'verify' to match images.")
    parser.add_argument("--filename", type=str, required=False, 
                        help="Path to the image file to verify (required in verify mode).")
    parser.add_argument("--threshold", type=float, default=0.37,
                        help="Threshold for matching (default: 0.37).")
    args = parser.parse_args()

    if args.mode == 'train':
        train(args)
    elif args.mode == 'verify':
        start = time()
        print(f'\nStarting verification for file: {args.filename}\n')
        try:
            result = verify_and_create_template(args)
            print(f"Verification result: {result}")  # Print the result (True or False)
        except Exception as e:
            print(f"An error occurred: {e}")
        end = time()
        print(f'\nTotal time: {end - start:.2f} seconds\n')

if __name__ == "__main__":
    main()
