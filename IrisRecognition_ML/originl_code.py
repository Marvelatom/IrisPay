from extractandenconding import extractFeature, matchingTemplate
from time import time
import argparse
import os

def main():
    # args
    parser = argparse.ArgumentParser(description="Verify and match image features against templates.")
    parser.add_argument("--filename", type=str, required=True, 
                        help="Path to the image file to verify (e.g., ../CASIA1/image.jpg).")
    parser.add_argument("--template_dir", type=str, default="./templates/CASIA1/",
                        help="Path to the directory containing template files (default: ./templates/CASIA1/).")
    parser.add_argument("--threshold", type=float, default=0.37,
                        help="Threshold for matching (default: 0.37).")
    args = parser.parse_args()

    # Verify file paths
    if not os.path.isfile(args.filename):
        raise FileNotFoundError(f"The file '{args.filename}' does not exist or cannot be accessed.")
    
    if not os.path.isdir(args.template_dir):
        raise NotADirectoryError(f"The directory '{args.template_dir}' does not exist or cannot be accessed.")

    # Timing the execution
    start = time()
    print(f'\nStarting verification for file: {args.filename}\n')

    try:
        # Extract features from the image file
        template, mask, filename = extractFeature(args.filename)
        
        if template is None or mask is None:
            raise ValueError("Feature extraction returned None for template or mask.")

        # Match the extracted features against templates
        result = matchingTemplate(template, mask, args.template_dir, args.threshold)

        # Process and display results
        if result == -1:
            print('\tNo registered sample found.')
        elif result == 0:
            print('\tNo sample found in the directory.')
        else:
            print(f'\tSamples found (in descending order of reliability):')
            for res in result:
                print(f"\t{res}")

    except Exception as e:
        print(f"An error occurred: {e}")

    # Total execution time
    end = time()
    print(f'\nTotal time: {end - start:.2f} seconds\n')

if __name__ == "__main__":
    main()
