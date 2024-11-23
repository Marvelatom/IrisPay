import argparse
import os
from glob import glob
from tqdm import tqdm
from time import time
import numpy as np
from multiprocessing import Pool, cpu_count
from extractandenconding import extractFeature
import pickle

# Parsing args from the terminal
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset_dir", type=str, default=r"D:\Capstone\softaware\IrisRecognition_ML\CASIA1",
                        help=r"Directory of the dataset (default: D:\Capstone\softaware\IrisRecognition_ML\CASIA1)")
    parser.add_argument("--template_dir", type=str, default="./templates/CASIA1/",
                        help="Destination of the features database (default: ./templates/CASIA1/)")
    parser.add_argument("--number_cores", type=int, default=cpu_count(),
                        help="Number of cores to use for multiprocessing (default: all available cores)")
    return parser.parse_args()

# Function to extract features and save them as .npy files
def pool_func(args):
    file, template_dir = args
    try:
        # Extract features from the image file
        template, mask, _ = extractFeature(file, multiprocess=False)
        if template is not None and mask is not None:
            basename = os.path.basename(file).replace('.jpg', '')  # Use the basename for saving
            np.save(os.path.join(template_dir, f"{basename}_template.npy"), template)
            np.save(os.path.join(template_dir, f"{basename}_mask.npy"), mask)
            return (basename, template)  # Returning basename and template for saving in pickle later
    except Exception as e:
        print(f"Error processing {file}: {e}")
    return None

def main():
    # Parse arguments
    args = parse_args()

    # Start timing
    start = time()

    # Create template directory if it doesn't exist
    if not os.path.exists(args.template_dir):
        print(f"Creating directory: {args.template_dir}")
        os.makedirs(args.template_dir)

    # Get list of image files
    files = glob(os.path.join(args.dataset_dir, "**/*_1_*.jpg"), recursive=True)
    files_2 = glob(os.path.join(args.dataset_dir, "**/*_2_*.jpg"), recursive=True)
    files += files_2

    n_files = len(files)
    print(f"Number of files to process: {n_files}")

    # Dictionary to store extracted features for saving in a pickle file
    feature_dict = {}

    # Multiprocessing pool
    with Pool(processes=args.number_cores) as pool:
        for result in tqdm(pool.imap_unordered(pool_func, [(file, args.template_dir) for file in files]), total=n_files):
            if result:
                basename, template = result
                feature_dict[basename] = template  # Saving the template for later

    print("Saving template database...")
    # Save the templates to a pickle file
    template_pkl_path = os.path.join(args.template_dir, "template_db.pkl")
    with open(template_pkl_path, 'wb') as f:
        pickle.dump(feature_dict, f)

    # End timing
    end = time()
    print(f'\nTotal processing time: {end - start:.2f} seconds\n')

if __name__ == "__main__":
    main()
