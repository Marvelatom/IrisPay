from PIL import Image

# Load the image
image_path = r'C:\Users\remna\Downloads\IrisRecognition_ML\src\Example.jpg'
img = Image.open(image_path)

# Convert to grayscale
gray_img = img.convert('L')

# Adjust the resolution (resize)
new_width = 320  # Example width
new_height = 280  # Example height
resized_img = gray_img.resize((new_width, new_height))

# Save the processed image
resized_img.save('processed_image.jpg')

# Optionally, display the processed image
resized_img.show()
