#!/usr/bin/env python3
import argparse
import subprocess
import os
import re
import shutil
import numpy as np
import math
from PIL import Image

def s3_path(arg_value):
    '''
    Argparse type for enforcing s3 path patterns on the command line
    '''
    pattern = re.compile(r"^s3:\/\/.+\/$")
    if not pattern.match(arg_value):
        raise argparse.ArgumentTypeError(f"{arg_value} is not a valid S3 path. 's3://BUCKET/' or 's3://BUCKET/OPTIONAL/PATH/")
    return arg_value

def trailing_slash(arg_value):
    '''
    Argparse type for enforcing path fragment patterns on the command line
    '''
    pattern = re.compile(r"^[^\/].*\/$")
    if not pattern.match(arg_value):
        raise argparse.ArgumentTypeError(f"{arg_value} must not start with a '/' character, but must end with a '/' character.")
    return arg_value

def get_args():
    '''
    Use argparse to get command line arguments.
    '''
    parser = argparse.ArgumentParser(prog="ingest-brainSwipes-data",
                                     description="Gets executive summary files from an s3 bucket for all subjects and sessions, reformats registraions and pushes all .png files to a new s3 bucket.")
    parser.add_argument("s3_subjects_path", type=s3_path, help=("The s3 bucket and path to the directory with the subjects list. " "`s3://BUCKET/` or `s3://BUCKET/OPTIONAL/PATH/`"))
    parser.add_argument("imgs_path", type=trailing_slash, help=("The path in the processed subject/session that holds the images to be ingested. " "include a trailing '/'" "e.g. files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/"))
    parser.add_argument("destination", type=s3_path, help=("The s3 bucket and path where data will be placed after transformation. " "`s3://BUCKET/` or `s3://BUCKET/OPTIONAL/PATH/`"))
    parser.add_argument("--start", type=int, default=1, help=("What number subject to start data ingestion at. Defaults to first subject."))
    parser.add_argument("--stop", type=int, help=("What number subject to stop data processing at. " "If not included will run all subjects."))
    parser.add_argument("--no_cleanup", "--no-cleanup", action="store_true", help=("Do not remove intermediary files."))
    parser.add_argument("--no_sessions", "--no-sessions", action="store_true", help=("Include this flag if your data does not have session levels."))

    return parser.parse_args()

def get_subjects(args):
    '''
    Return a list of all subjects at the user input s3 path
    '''
    try:
        print("Getting subject list...")
        subjects = []
        cmd = ['s3cmd', 'ls', args.s3_subjects_path]
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, universal_newlines=True)
        regex = re.compile('(sub-.*)\/')
        with process.stdout:
            for line in process.stdout:
                match = re.search(regex, line)
                sub = match.group(1)
                subjects.append(sub)
        print(f"Found {len(subjects)} subjects")
        return subjects
    except Exception as e:
        print("Error getting subjects:")
        print(e)

def get_sessions(subject, args):
    '''
    Return a list of all sessions under the given subject
    '''
    try:
        print(f"Getting sessions for {subject}")
        sessions = []
        path_to_sessions = args.s3_subjects_path + subject + '/'
        cmd = ['s3cmd', 'ls', path_to_sessions]
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, universal_newlines=True)
        regex = re.compile('(ses-.*)\/')
        with process.stdout:
            for line in process.stdout:
                match = re.search(regex, line)
                ses = match.group(1)
                sessions.append(ses)
        return sessions
    except Exception as e:
        print("Error getting sessions:")
        print(e)

def download_imgs(subject, session, dir, args):
    '''
    calls s3cmd as a subprocess to download all files in the user input image path for a specific subject/session
    '''
    try:
        print(f"Downloading {subject} {session} from S3")
        os.mkdir(dir)
        if session:
            session = session + '/'
        img_path = args.s3_subjects_path + subject + '/' + session + args.imgs_path
        print(img_path)
        cmd = ['s3cmd', 'get', '--recursive', img_path]
        process = subprocess.check_call(cmd, cwd=f"./{dir}", stdout=subprocess.DEVNULL)

    except Exception as e:
        print("Error downloading images:")
        print(e)

def cleanup(dir):
    '''
    deletes all files and subdirectories in a directory then removes the directory
    '''
    try:
        print(f"Removing intermdiary files: {dir}")
        shutil.rmtree(dir)
    except Exception as e:
        print("Error cleaning up subject")
        print(e)

def rearrange_image(gif, output_dir):
    '''
    Transforms a image file with a 1x9 array of images into a 3x3 grid.
    Images sliced based on expected ratios defined in first_boundary and second_boundary
    '''
    print(f"Rearranging {gif}")
    im = np.asarray(Image.open(gif))
    full_length = im.shape[1]
    # First section should always be the biggest
    first_boundary = round(0.375 * full_length)
    second_boundary = round(0.683 * full_length)
    mid_length = second_boundary - first_boundary
    bot_length = full_length - second_boundary

    mid_padding = [math.floor((first_boundary - mid_length)/2), math.ceil((first_boundary - mid_length)/2)]
    bot_padding = [math.floor((first_boundary - bot_length)/2), math.ceil((first_boundary - bot_length)/2)]

    top_row = im[:,0:first_boundary,:]
    mid_row = np.pad(im[:,first_boundary:second_boundary,:], ((0,0),(mid_padding[0],mid_padding[1]),(0,0)), mode='constant')
    bot_row = np.pad(im[:,second_boundary:full_length,:], ((0,0), (bot_padding[0],bot_padding[1]), (0,0)), mode='constant')


    x = np.concatenate((top_row, mid_row, bot_row), axis=0)
    new_x = ((x - x.min()) * (1/(x.max() - x.min()) * 255)).astype('uint8')
    new_im = Image.fromarray(np.uint8(new_x))
    # all images should have the a .png extension
    new_name = os.path.basename(gif).replace('.gif', '.png')
    new_im.save(os.path.join(output_dir, new_name))

    return

def process_imgs(dir, lookfor):
    '''
    finds all file matches in the directory and calls rearrange_image on them
    '''
    try:
        print(f"Processing images in {dir}")
        process = subprocess.Popen(['ls', dir], stdout=subprocess.PIPE, universal_newlines=True)
        process.wait()
        with process.stdout:
            for file in process.stdout:
                file = file.strip()
                if any(string in file for string in lookfor):
                    rearrange_image(os.path.join(dir, file), dir)
    except Exception as e:
        print("Error processing images:")
        print(e)

def upload_imgs(dir, bucket):
    '''
    calls s3cmd to upload all .png images in `dir` to `bucket`
    '''
    try:
        print(f"Uploading images to S3")
        process = subprocess.Popen(['ls', dir], stdout=subprocess.PIPE, universal_newlines=True)
        process.wait()
        with process.stdout:
            for file in process.stdout:
                file = file.strip()
                if file.endswith('.png'):
                    cmd = ["s3cmd", "put", file, bucket]
                    subprocess.check_call(cmd, cwd=f"./{dir}", stdout=subprocess.DEVNULL)
    except Exception as e:
        print("Error uploading images:")
        print(e)

def main():
    args = get_args()
    subjects = get_subjects(args)
    num_subjects = len(subjects)
    lookfor = [
        #XCPD image names
        'desc-AnatOnAtlas_T1w.png',
        'desc-AtlasOnAnat_T1w.png',
        'desc-AnatOnAtlas_T2w.png',
        'desc-AtlasOnAnat_T2w.png',
        'desc-T1wOnTask_bold.png',
        'desc-TaskOnT1w_bold.png',
        'desc-T2wOnTask_bold.png',
        'desc-TaskOnT2w_bold.png',
        #DCANBOLDProc image names
        'desc-AtlasInT1w.gif',
        'desc-T1wInAtlas.gif',
        'desc-T1InTask.gif',
        'desc-TaskInT1.gif',
        'desc-AtlasInT2w.gif',
        'desc-T2wInAtlas.gif',
        'desc-T2InTask.gif',
        'desc-TaskInT2.gif'
    ]

    for index, subject in enumerate(subjects):
        if index + 1 < args.start:
            continue
        if args.stop:
            if index + 1 > args.stop:
                break
        if not args.no_sessions:
            sessions = get_sessions(subject, args)
            for session in sessions:
                dir = subject + '-' + session
                print(f"Processing {subject}/{session}")
                download_imgs(subject, session, dir, args)
                process_imgs(dir, lookfor)
                upload_imgs(dir, args.destination)
                if not args.no_cleanup:
                    cleanup(dir)
        else:
            dir = subject
            print(f"Processing {subject}")
            download_imgs(subject, '', dir, args)
            process_imgs(dir, lookfor)
            upload_imgs(dir, args.destination)
            if not args.no_cleanup:
                cleanup(dir)

        print(f"completed subject {index + 1} of {num_subjects}")



if __name__ == "__main__":
    main()