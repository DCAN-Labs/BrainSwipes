#!/usr/bin/env python3
import argparse
import subprocess
import os
import re
import shutil
import time
from glob import glob

def get_args():
    parser = argparse.ArgumentParser(prog="Anat QC image generator S3 wrapper",
                                     description="Gets data from an S3 bucket, generates a QC image and cleans up the work dir. For use with docker://dcanumn/hbcd_anat_qc")
    parser.add_argument("container", help=("Path to SIF file for anat qc image generation container."))
    parser.add_argument("source", help=("The source s3 bucket on MSI data is currently in. " " Do not include the prefix s3://"))
    parser.add_argument("subjects_path", help=("The path in the s3 bucket that holds the processed subjects. " "include a trailing '/'" "e.g. processed/abcd-hcp-pipeline/"))
    parser.add_argument("--start", type=int, default=1, help=("What number subject to start data processing at. " "Defaults to first subject."))
    parser.add_argument("--stop", type=int, help=("What number subject to stop data processing at. " "If not included will run all subjects."))
    parser.add_argument("--work_dir", "-w", default="work", help=("Directory to place intermediate files in. " "Defaults to `<current active directory>/work/`"))
    parser.add_argument("--output_dir", "-o", default="output", help=("Directory to place output images. " "Defaults to `<current working directory>/output/`"))
    return parser.parse_args()

def get_subjects(args):
    subjects = []
    path_to_subjects = 's3://' + os.path.join(args.source, args.subjects_path)
    cmd = ['s3cmd', 'ls', path_to_subjects]
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
        print(f"Downloading {subject}")
        subj_path = "s3://" + os.path.join(args.source, args.subjects_path, subject)
        cmd = ['s3cmd', 'get', '--recursive', subj_path]
        bids_dir = os.path.join(args.work_dir, 'bids')
        process = subprocess.check_call(cmd, cwd=f"./{bids_dir}", stdout=subprocess.DEVNULL)

    except Exception as e:
        print("Error downloading images:")
        print(e)

def run_anat_qc_container(args, subject):
    try:
        print(f"Running anat_qc container on {subject}")
        bids_dir = os.path.join(args.work_dir, 'bids')
        cmd = ['singularity', 'run', args.container, bids_dir, args.work_dir, 'participant']
        subprocess.check_call(cmd)
    except Exception as e:
        print(f"Error processing subject: {subject}")
        print(e)

def save_pngs(args, subject):
    try:
        print(f"Saving .png files for {subject}")
        source = os.path.join(args.work_dir, subject, 'ses-*', 'anat', '*.png')
        files = glob(source)
        for file in files:
            new_path = os.path.join(args.output_dir, os.path.basename(file))
            shutil.copyfile(file, new_path)
    except Exception as e:
        print(f"Error copying images: {subject}")
        print(e)


def cleanup(args, subject):
    try:
        print(f"Removing intermediate files for {subject}")
        intermediates_dir = os.path.join(args.work_dir, subject)
        shutil.rmtree(intermediates_dir)
        bids = os.path.join(args.work_dir, 'bids', subject)
        shutil.rmtree(bids)
    except Exception as e:
        print(f"Error cleaning up subject {subject}")
        print(e)

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
        print(f"Processing subject {index + 1} of {len(subjects)}")
        download_imgs(args, subject)
        run_anat_qc_container(args, subject)
        save_pngs(args, subject)
        cleanup(args, subject)
        end_subj = time.time()
        print(f"Finished subject {subject}. Time elapsed: {round((end_subj-start_subj)/60, 3)} minutes")
    end = time.time()
    print(f"Finished image generation. Time elapsed: {round((end-start)/60, 3)} minutes")

if __name__ == "__main__":
    main()