# Available Image Types

## Executive Summary Images
The most common use case for BrainSwipes is executive summary images. These are common outputs of many processing pipelines.
Explore the types of images commonly output by these in the tutorials.
If you would like to include executive summary images on BrainSwipes for your dataset, you will need to process your data with a pipeline that generates these.

See [XCPD](https://github.com/PennLINC/xcp_d) or [DCAN BOLD PROC](https://github.com/DCAN-Labs/dcan_bold_processing)

### Reshaping Executive Summary Images
Some versions of the executive summary output registrations in a 1x9 grid.

<img src="../img/atlas-registration-row.png" alt="Example image in the original 1x9 format" width="500">

These are hard to see in BrainSwipes. We have in included a function that reshapes these images into a 3x3 grid as part of the `ingest_brainswipes_data.py`

<img src="../img/atlas-registration-grid.png" alt="Example image in the reorganized 3x3 format" width="500">

## Pre-Processed Images
Pre-Processed images can be created by running [this BIDS app](https://github.com/erikglee/HBCD_Raw_Anat_QC_Container) on your dataset. This will output 3x3 grids of unprocessed T1w or T2w images to help QC raw anatomical data.

## QSI-Prep Images
QSI-Prep images can be created by running [this BIDS app](https://github.com/DCAN-Labs/QSIPREP_HBCD_QC) on your dataset. This will output `.GIF` files to help QC Diffusion Weighted Images.

<img src="../img/qsi-qc.gif" alt="Example QSI-Prep QC gif" width="500">

## Other images
BrainSwipes can be used with any simple image file (e.g. `.PNG` or `.GIF` files).
If you have needs that are not mey by any of the existing image types feel free to generate your own.

<img src="../img/preprocessed.png" alt="Example Pre-Processed QC image" width="500"/>
