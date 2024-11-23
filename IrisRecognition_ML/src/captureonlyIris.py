import cv2
import numpy as np
import os

# Load the pre-trained classifiers for face and eyes
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

# Start video capture from the webcam
cap = cv2.VideoCapture(0)

iris_captured = 0  # Counter to track number of iris images captured

# Define the directory where the images will be saved
save_directory = r"D:\Capstone\softaware\IrisRecognition_ML\CASIA1\300"

# Create the directory if it doesn't exist
if not os.path.exists(save_directory):
    os.makedirs(save_directory)

# Function to calculate sharpness (using variance of Laplacian)
def is_image_sharp(image, threshold=100):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    return laplacian_var > threshold

# Function to calculate contrast (standard deviation of pixel intensities)
def has_sufficient_contrast(image, threshold=30):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    contrast = gray.std()
    return contrast > threshold

# Function to check circularity (assuming binary thresholding)
def is_circular(image, threshold=0.4):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, binary_image = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(binary_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for contour in contours:
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        if perimeter == 0:
            continue
        circularity = 4 * np.pi * area / (perimeter ** 2)
        if circularity > threshold:
            return True
    return False

# Function to check if iris is centered in the frame
def is_iris_centered(x, y, w, h, frame_width, frame_height, margin=0.3):
    center_x = x + w / 2
    center_y = y + h / 2
    frame_center_x = frame_width / 2
    frame_center_y = frame_height / 2

    # Check if the iris is close enough to the center of the frame
    return abs(center_x - frame_center_x) < frame_width * margin and abs(center_y - frame_center_y) < frame_height * margin

# Loop until 10 images are captured
while iris_captured < 10:  
    # Read each frame from the webcam
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame. Exiting...")
        break

    # Convert the frame to grayscale for face and eye detection
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect faces in the frame
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    for (x, y, w, h) in faces:
        # Region of interest for the face
        roi_gray = gray[y:y+h, x:x+w]
        roi_color = frame[y:y+h, x:x+w]

        # Detect eyes within the face region, with adjusted parameters
        eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))

        for (ex, ey, ew, eh) in eyes:
            # Ensure that the detected eye region is not too large (avoid capturing eyebrows)
            if ew < 40 or eh < 40:  # Skip small detections
                continue

            # Region of interest for the eye (possible iris region)
            eye_roi = roi_color[ey:ey+eh, ex:ex+ew]

            # Check if the detected eye region meets all quality requirements and is centered
            if (is_image_sharp(eye_roi) and 
                has_sufficient_contrast(eye_roi) and 
                is_circular(eye_roi) and 
                is_iris_centered(ex, ey, ew, eh, frame.shape[1], frame.shape[0])):
                
                # Convert the iris (eye) image to grayscale
                gray_eye = cv2.cvtColor(eye_roi, cv2.COLOR_BGR2GRAY)

                # Validate if the image is not empty before saving
                if gray_eye.size == 0:
                    print(f"Error: Empty iris image detected. Skipping...")
                    continue  # Skip saving this image

                # Save the iris (eye) image with a unique filename in the specified folder
                filename = f"300_1_{iris_captured + 1}.jpg"
                filepath = os.path.join(save_directory, filename)
                cv2.imwrite(filepath, gray_eye)  # Save the greyscale image
                iris_captured += 1  # Increment the counter for captured images
                print(f"Ideal iris image {iris_captured} captured and saved as '{filepath}'")
                break  # Exit the loop once the ideal iris is captured

    # If 10 images have been captured, terminate the loop and close the window
    if iris_captured >= 10:
        break

    # Display the result in a window
    cv2.imshow('Webcam - Iris Detection', frame)

    # Press 'q' to manually exit the loop if needed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break



# Release the webcam and close all windows
cap.release()
cv2.destroyAllWindows()
