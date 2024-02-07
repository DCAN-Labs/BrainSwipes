#!/usr/bin/env python3
import argparse
import subprocess
import os
import re
import shutil
import numpy as np
from PIL import Image

def get_args():
    parser = argparse.ArgumentParser(prog="ingest-brainSwipes-data",
                                     description="Gets executive summary files from an s3 bucket, reformats registraions and pushes all .png files to a new s3 bucket.")
    parser.add_argument("source", help=("The name of the s3 bucket on MSI data is currently in. " "Do not include the prefix 's3://'"))
    parser.add_argument("subjects_path", help=("The path in the s3 bucket that holds the processed subjects. " "include a trailing '/'" "e.g. processed/abcd-hcp-pipeline/"))
    parser.add_argument("imgs_path", help=("The path in the processed subject that holds the images to be ingested. " "include a trailing '/'" "e.g. files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/"))
    parser.add_argument("destination", help=("The name of the s3 bucket on MSI data will be placed after transformation. " "Do not include the prefix 's3://'"))
    parser.add_argument("--pipeline", choices=['dcan', 'xcpd'], default="dcan", help=("The pipleine used to generate the executive summary. " "Defaults to dcan"))

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
            sub = match.group(1)
            subjects.append(sub)
    return subjects

def get_sessions(subject, args):
    sessions = []
    path_to_sessions = 's3://' + os.path.join(args.source, args.subjects_path, subject) + '/'
    cmd = ['s3cmd', 'ls', path_to_sessions]
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, universal_newlines=True)
    regex = re.compile('(ses-.*)\/')
    with process.stdout:
        for line in process.stdout:
            match = re.search(regex, line)
            ses = match.group(1)
            sessions.append(ses)
    return sessions

def download_imgs(subject, session, dir, args):
    try:
        os.mkdir(dir)
        img_path = "s3://" + os.path.join(args.source, args.subjects_path, subject, session, args.imgs_path)
        cmd = ['s3cmd', 'get', '--recursive', img_path]
        process = subprocess.Popen(cmd, cwd=f"./{dir}", stdout=subprocess.PIPE)
        process.wait()

    except Exception as e:
        print("Error downloading images:")
        print(e)

def cleanup(dir):
    try:
        shutil.rmtree(dir)
    except Exception as e:
        print("Error cleaning up subject")
        print(e)

def rearrange_image(gif, output_dir, pipeline):

    im = np.asarray(Image.open(gif))

    if pipeline == "xpcd":
        if 'Task' in os.path.basename(gif):
            top_row = im[:,0:350,:]
            mid_row = np.pad(im[:,350:640,:], ((0,0),(35,25),(0,0)), mode='constant')
            bot_row = np.pad(im[:,640:,:], ((0,0), (26,25), (0,0)), mode='constant')
        elif 'Subcort' in os.path.basename(gif):
            top_row = im[:,0:321]
            mid_row = np.pad(im[:,321:597], ((0,0),(20,25)), mode='constant')
            bot_row = np.pad(im[:,597:], ((0,0), (20,25)), mode='constant')
        elif 'Atlas' in os.path.basename(gif):
            top_row = im[:,0:655,:]
            mid_row = np.pad(im[:,653:1193,:], ((0,0),(60,55),(0,0)), mode='constant')
            bot_row = np.pad(im[:,1193:,:], ((0,0), (47,55), (0,0)), mode='constant')
        else:
            top_row = im[:,0:640,:]
            mid_row = np.pad(im[:,640:1193,:], ((0,0),(32,55),(0,0)), mode='constant')
            bot_row = np.pad(im[:,1193:,:], ((0,0), (32,55), (0,0)), mode='constant')
    else:
        if 'Task' in os.path.basename(gif):
            top_row = im[:,0:321,:]
            mid_row = np.pad(im[:,321:597,:], ((0,0),(20,25),(0,0)), mode='constant')
            bot_row = np.pad(im[:,597:,:], ((0,0), (20,25), (0,0)), mode='constant')
        elif 'Subcort' in os.path.basename(gif):
            top_row = im[:,0:321]
            mid_row = np.pad(im[:,321:597], ((0,0),(20,25)), mode='constant')
            bot_row = np.pad(im[:,597:], ((0,0), (20,25)), mode='constant')
        else:
            top_row = im[:,0:640,:]
            mid_row = np.pad(im[:,640:1193,:], ((0,0),(32,55),(0,0)), mode='constant')
            bot_row = np.pad(im[:,1193:,:], ((0,0), (32,55), (0,0)), mode='constant')

    x = np.concatenate((top_row, mid_row, bot_row), axis=0)
    new_x = ((x - x.min()) * (1/(x.max() - x.min()) * 255)).astype('uint8')
    new_im = Image.fromarray(np.uint8(new_x))
    # all images should have the a .png extension
    new_name = os.path.basename(gif).replace('.gif', '.png')
    new_im.save(os.path.join(output_dir, new_name))

    return

def process_imgs(dir, pipeline):
    process = subprocess.Popen(['ls', dir], stdout=subprocess.PIPE, universal_newlines=True)
    process.wait()
    with process.stdout:
        for file in process.stdout:
            file = file[:-1] # strip \n character
            if file.endswith('.gif'):
                filename = os.path.join(dir, file)
                rearrange_image(filename, dir, pipeline)

def upload_imgs(dir, bucket):
    process = subprocess.Popen(['ls', dir], stdout=subprocess.PIPE, universal_newlines=True)
    process.wait()
    with process.stdout:
        for file in process.stdout:
            file = file[:-1] # strip \n character
            if file.endswith('.png'):
                cmd = ["s3cmd", "put", file, bucket]
                process2 = subprocess.Popen(cmd, cwd=f"./{dir}", stdout=subprocess.PIPE)
                process2.wait()

def main():
    args = get_args()
    subjects = get_subjects(args)
    num_subjects = len(subjects)
    bucket = "s3://" + args.destination
    pipeline = args.pipeline

    for index, subject in enumerate(subjects):
        sessions = get_sessions(subject, args)
        for session in sessions:
            dir = subject + '-' + session
            print(f"Processing {subject}/{session}")
            download_imgs(subject, session, dir, args)
            process_imgs(dir, pipeline)
            upload_imgs(dir, bucket)
            cleanup(dir)

        print(f"completed {index + 1} of {num_subjects}")



if __name__ == "__main__":
    main()