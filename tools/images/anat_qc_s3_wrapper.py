#!/usr/bin/env python3
import argparse
import subprocess
import os
import re
import shutil
import time
from glob import glob

def s3_path(arg_value):
    '''
    Argparse type for enforcing s3 path patterns on the command line
    '''
    pattern = re.compile(r"^s3:\/\/.+\/$")
    if not pattern.match(arg_value):
        raise argparse.ArgumentTypeError(f"{arg_value} is not a valid S3 path. 's3://BUCKET/' or 's3://BUCKET/OPTIONAL/PATH/")
    return arg_value

def get_args():
    parser = argparse.ArgumentParser(prog="Anat QC image generator S3 wrapper",
                                     description="Gets data from an S3 bucket, generates a QC image and cleans up the work dir. For use with docker://dcanumn/hbcd_anat_qc")
    parser.add_argument("container", help=("Path to SIF file for anat qc image generation container."))
    parser.add_argument("s3_subjects_path", type=s3_path, help=("The s3 bucket and path to the directory with the subjects list. " "`s3://BUCKET/` or `s3://BUCKET/OPTIONAL/PATH/`"))
    parser.add_argument("--start", type=int, default=1, help=("What number subject to start data processing at. " "Defaults to first subject."))
    parser.add_argument("--stop", type=int, help=("What number subject to stop data processing at. " "If not included will run all subjects."))
    parser.add_argument("--work_dir", "-w", default="work", help=("Directory to place intermediate files in. " "Defaults to `<current active directory>/work/`"))
    parser.add_argument("--output_dir", "-o", default="output", help=("Directory to place output images. " "Defaults to `<current working directory>/output/`"))
    parser.add_argument("--no_cleanup", "--no-cleanup", action="store_true", help=("Do not remove intermediary files."))

    return parser.parse_args()

def get_subjects(args):
    subjects = []
    cmd = ['s3cmd', 'ls', args.s3_subjects_path]
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, universal_newlines=True)
    regex = re.compile('(sub-.*)\/')
    with process.stdout:
        for line in process.stdout:
            match = re.search(regex, line)
            if match:
                sub = match.group(1)
                subjects.append(sub)
    return subjects


def download_imgs(args, subject):
    try:
        print(f"Downloading {subject}", flush=True)
        subj_path =  args.s3_subjects_path + subject
        print(f"Subject path: {subj_path}", flush=True)
        cmd = ['s3cmd', 'get', '--recursive', subj_path]
        bids_dir = os.path.join(args.work_dir, 'bids')
        process = subprocess.check_call(cmd, cwd=f"./{bids_dir}", stdout=subprocess.DEVNULL)

    except Exception as e:
        print("Error downloading images:", flush=True)
        print(e, flush=True)

def run_anat_qc_container(args, subject):
    try:
        print(f"Running anat_qc container on {subject}", flush=True)
        bids_dir = os.path.join(args.work_dir, 'bids')
        cmd = ['singularity', 'run', args.container, bids_dir, args.work_dir, 'participant', '--participant-label', subject]
        subprocess.check_call(cmd)
    except Exception as e:
        print(f"Error processing subject: {subject}", flush=True)
        print(e, flush=True)

def save_pngs(args, subject):
    try:
        print(f"Saving .png files for {subject}", flush=True)
        source = os.path.join(args.work_dir, subject, 'ses-*', 'anat', '*.png')
        files = glob(source)
        for file in files:
            new_path = os.path.join(args.output_dir, os.path.basename(file))
            shutil.copyfile(file, new_path)
    except Exception as e:
        print(f"Error copying images: {subject}", flush=True)
        print(e, flush=True)


def cleanup(args, subject):
    try:
        print(f"Removing intermediate files for {subject}", flush=True)
        intermediates_dir = os.path.join(args.work_dir, subject)
        shutil.rmtree(intermediates_dir)
        bids = os.path.join(args.work_dir, 'bids', subject)
        shutil.rmtree(bids)
    except Exception as e:
        print(f"Error cleaning up subject {subject}", flush=True)
        print(e, flush=True)

def main():
    start = time.time()
    args = get_args()
    subjects = get_subjects(args)
    os.makedirs(os.path.join(args.work_dir, 'bids'), exist_ok=True)
    os.makedirs(args.output_dir, exist_ok=True)
    
    for index, subject in enumerate(subjects):
        if index + 1 < args.start:
            continue
        if args.stop:
            if index + 1 > args.stop:
                break
        start_subj = time.time()
        print(f"Processing subject {index + 1} of {len(subjects)}", flush=True)
        download_imgs(args, subject)
        run_anat_qc_container(args, subject)
        save_pngs(args, subject)
        if not args.no_cleanup:
            cleanup(args, subject)
        end_subj = time.time()
        print(f"Finished subject {subject}. Time elapsed: {round((end_subj-start_subj)/60, 3)} minutes", flush=True)
    end = time.time()
    print(f"Finished image generation. Time elapsed: {round((end-start)/60, 3)} minutes", flush=True)

if __name__ == "__main__":
    main()