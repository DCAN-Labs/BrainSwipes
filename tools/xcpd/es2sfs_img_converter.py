#! /usr/bin/env python3

import sys, os
import argparse
from PIL import Image
import numpy as np

"""
Images used in the Swipes For Science app are typically derived from the following locations 
within the HCP proccesed data output folder for each subject:

    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T1-Axial-BasalGangila-Putamen.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T1-Axial-InferiorTemporal-Cerebellum.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T1-Axial-SuperiorFrontal.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T1-Coronal-Caudate-Amygdala.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T1-Coronal-OrbitoFrontal.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T1-Coronal-PosteriorParietal-Lingual.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T1-Sagittal-CorpusCallosum.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T1-Sagittal-Insula-FrontoTemporal.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T1-Sagittal-Insula-Temporal-HippocampalSulcus.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T2-Axial-BasalGangila-Putamen.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T2-Axial-InferiorTemporal-Cerebellum.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T2-Axial-SuperiorFrontal.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T2-Coronal-Caudate-Amygdala.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T2-Coronal-OrbitoFrontal.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T2-Coronal-PosteriorParietal-Lingual.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T2-Sagittal-CorpusCallosum.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T2-Sagittal-Insula-FrontoTemporal.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_T2-Sagittal-Insula-Temporal-HippocampalSulcus.png
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_desc-AtlasInSubcort.gif
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_desc-AtlasInT1w.gif
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_desc-SubcortInAtlas.gif
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_desc-T1wInAtlas.gif
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_task-rest_run-X_desc-T1InTask.gif
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_task-rest_run-X_desc-T2InTask.gif
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_desc-AtlasInSubcort.gif
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_desc-AtlasInT1w.gif
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_desc-SubcortInAtlas.gif
    files/summary_DCANBOLDProc_v4.0.0/executivesummary/img/SUBJECT_SESSION_desc-T1wInAtlas.gif

Due to changes within Executive Summary all of the images that depict the quality of registration 
(ie AtlasInT1w, T1InTask, etc. these will all have extension .gif) are formatted in a row. This is
not compatible with the SFS app so the images must be rearranged into a rectangle.

This script takes an input image and reformats it accordingly by identifing substrings within the image name.

WARNING: This script was not designed for longevity and it may break with updates to ES or DBP
"""

prog_descrip = "This script converts images of registration quality created by the Ecexutive Summary into" \
               " a format that is more sutible for Swipes for Science."


def rearrange_image(gif, output_dir):

    im = np.asarray(Image.open(gif))

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

    x = np.concatenate((top_row, mid_row, bot_row), axis=0)
    new_x = ((x - x.min()) * (1/(x.max() - x.min()) * 255)).astype('uint8')
    new_im = Image.fromarray(np.uint8(new_x))
    # all images should have the a .png extension
    new_name = os.path.basename(gif).replace('.gif', '.png')
    new_im.save(os.path.join(output_dir, new_name))

    return

def generate_parser(parser=None):

    if not parser:
        parser = argparse.ArgumentParser(
            description = prog_descrip
        )
    parser.add_argument(
        '-i',
        '--input-img',
        required=True,
        help='Path to an input image that needs to be reformatted to be SFS compatibile. Should have extension .gif'
    )
    parser.add_argument(
        '-o',
        '--output-dir',
        required=True,
        help='Path to an output directory for the reformatted image. The output image will be created in that directory' \
             'with the same basename but extension .png'
    )

    return parser

def main():
    parser = generate_parser()
    args = parser.parse_args()

    rearrange_image(args.input_img, args.output_dir)

    return

    

if __name__ == '__main__':
    main()
    

