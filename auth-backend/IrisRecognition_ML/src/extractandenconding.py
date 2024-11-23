import os
from os import listdir
from multiprocessing import Pool, cpu_count
from itertools import repeat
from fnmatch import filter
import numpy as np
import warnings
import cv2
from imgutils import segment, normalize

warnings.filterwarnings("ignore")

DATABASE_PATH = './templates/'

##########################################################################
# Function which generates the iris template used in matching
##########################################################################

def encode_iris(arr_polar, arr_noise, minw_length, mult, sigma_f):
    """
    Generate iris template and noise mask from the normalized iris region.
    """
    filterb = gaborconvolve_f(arr_polar, minw_length, mult, sigma_f)
    l = arr_polar.shape[1]
    template = np.zeros([arr_polar.shape[0], 2 * l])
    mask_noise = np.zeros(template.shape)

    H1 = np.real(filterb) > 0
    H2 = np.imag(filterb) > 0
    H3 = np.abs(filterb) < 0.0001

    for i in range(l):
        ja = 2 * i
        template[:, ja] = H1[:, i]
        template[:, ja + 1] = H2[:, i]
        mask_noise[:, ja] = arr_noise[:, i] | H3[:, i]
        mask_noise[:, ja + 1] = arr_noise[:, i] | H3[:, i]

    return template, mask_noise


def gaborconvolve_f(img, minw_length, mult, sigma_f):
    """
    Convolve each row of an image with 1D log-Gabor filters.
    """
    rows, ndata = img.shape
    logGabor_f = np.zeros(ndata)
    filterb = np.zeros([rows, ndata], dtype=complex)

    radius = np.arange(ndata // 2 + 1) / (ndata / 2) / 2
    radius[0] = 1

    fo = 1 / minw_length
    logGabor_f[0:ndata // 2 + 1] = np.exp((-(np.log(radius / fo)) ** 2) / (2 * np.log(sigma_f) ** 2))
    logGabor_f[0] = 0

    for r in range(rows):
        signal = img[r, :]
        imagefft = np.fft.fft(signal)
        filterb[r, :] = np.fft.ifft(imagefft * logGabor_f)

    return filterb


##########################################################################
# Feature Extraction Function
##########################################################################

def extractFeature(img_filename, eyelashes_threshold=80, multiprocess=True):
    radial_resolution = 20
    angular_resolution = 240
    minw_length = 18
    mult = 1
    sigma_f = 0.5

    # Read the image in grayscale
    im = cv2.imread(img_filename, 0)

    # Perform segmentation
    ciriris, cirpupil, imwithnoise = segment(im, eyelashes_threshold, multiprocess)

    # Perform normalization
    arr_polar, arr_noise = normalize(
        imwithnoise, ciriris[1], ciriris[0], ciriris[2], cirpupil[1], cirpupil[0], cirpupil[2],
        radial_resolution, angular_resolution
    )

    # Encode the normalized iris
    template, mask_noise = encode_iris(arr_polar, arr_noise, minw_length, mult, sigma_f)

    return template, mask_noise, img_filename


##########################################################################
# Matching Function
##########################################################################

def matchingTemplate(template_extr, mask_extr, template_dir, threshold=0.38):
    """
    Match the extracted template with the templates stored in the database.
    """
    npy_files = filter(listdir(template_dir), '*.npy')

    if not npy_files:
        return -1

    # Prepare arguments for multiprocessing
    args = zip(
        sorted(npy_files),
        repeat(template_extr),
        repeat(mask_extr),
        repeat(template_dir),
    )

    # Limit the number of processes to `cpu_count() - 1` to avoid oversubscription
    with Pool(processes=cpu_count() - 1) as pool:
        result_list = pool.starmap(matchingPool, args)

    filenames, hm_dists = zip(*result_list)
    hm_dists = np.array(hm_dists)

    # Remove NaN elements
    valid_indices = np.where(hm_dists > 0)[0]
    hm_dists = hm_dists[valid_indices]
    filenames = [filenames[i] for i in valid_indices]

    # Filter by threshold early
    below_threshold = np.where(hm_dists <= threshold)[0]
    if len(below_threshold) == 0:
        return 0

    hm_dists = hm_dists[below_threshold]
    filenames = [filenames[i] for i in below_threshold]
    sorted_indices = np.argsort(hm_dists)

    return [filenames[i] for i in sorted_indices]


def matchingPool(file_temp_name, template_extr, mask_extr, template_dir):
    """
    Perform matching within a multiprocessing pool, using memory-mapped npy files for efficiency.
    """
    template_path = os.path.join(template_dir, file_temp_name)

    # Use memory-mapping for faster access to the data without fully loading it into memory
    template = np.load(template_path.replace("_mask.npy", "_template.npy"), mmap_mode='r')
    mask = np.load(template_path.replace("_template.npy", "_mask.npy"), mmap_mode='r')

    # Calculate the Hamming distance
    hm_dist = HammingDistance(template_extr, mask_extr, template, mask)

    return file_temp_name, hm_dist


##########################################################################
# Hamming Distance Calculation
##########################################################################

def HammingDistance(template1, mask1, template2, mask2):
    """
    Calculate the Hamming distance between two iris templates, with an early exit condition if the distance exceeds a threshold.
    """
    hd = np.nan
    early_exit_threshold = 0.5  # Set a threshold for early exit if distance exceeds this value

    for shift in range(-8, 9):
        shifted_template1 = shiftbits(template1, shift)
        shifted_mask1 = shiftbits(mask1, shift)

        mask = np.logical_or(shifted_mask1, mask2)
        valid_bits = np.sum(mask == 0)
        differing_bits = np.sum(np.logical_xor(shifted_template1, template2) & ~mask)

        if valid_bits == 0:
            continue
        else:
            new_hd = differing_bits / valid_bits
            if np.isnan(hd) or new_hd < hd:
                hd = new_hd

            # Early exit if hamming distance exceeds the threshold
            if hd > early_exit_threshold:
                return hd

    return hd


def shiftbits(template, shifts):
    """
    Shift the bitwise iris patterns for Hamming distance calculation.
    """
    ncols = template.shape[1]
    shifted_template = np.zeros_like(template)

    if shifts < 0:
        shifted_template[:, :ncols + shifts] = template[:, -shifts:]
        shifted_template[:, ncols + shifts:] = template[:, : -shifts]
    elif shifts > 0:
        shifted_template[:, shifts:] = template[:, :ncols - shifts]
        shifted_template[:, :shifts] = template[:, ncols - shifts:]

    return shifted_template
