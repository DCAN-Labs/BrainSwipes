# Tools

A description of scripts in the tools folder.

Scripts may require `brainswipes-firebase-adminsdk.json` or `brainswipes-rtdb-token.json` to run.
To generate these JSONs visit the Firebase console. Put them in the top level directory where they will be excluded from git via the `.gitignore` file.

## Admin
Tools in this folder interact with the Firebase Admin SDK. Operations with the Admin SDK will require the `brainswipes-firebase-adminsdk.json` which can be [downloaded from Firebase](https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments).
You will need to use the Admin SDK to make changes to study access as this is managed by custom claims which are not accessible through other means.

- **modifyUsers.js**

    - This tool will do nothing out of the box. It is a collection of functions that interact with the admin sdk and firebase user records. Manual edits will be required to run this.
    - Especially useful is the `updateCusomClaims` function for use when changing studies from restricted to open, or removing studies entirely.

## Database
Tools in this folder read or modify the firebase realtime database records. There are a variety of ways to get a snapshot of the database and restore it, please consider backing up the database before running these scripts if you are unsure.

- **addDatasetScores.js**

    - This script was built to update the database for the release of the user feedback feature. Unlikely to be needed in the future. 

- **firebaseBackup.js**

    - Pulls a copy of firebase and stashes it in an S3 bucket.

    - Requires a `brainswipes-rtdb-token.json` which contains a [database secret](https://firebase.google.com/docs/database/rest/auth#legacy_tokens) from the firebase settings.
        ```
        {
            "token": "FIREBASE-DATABASE-SECRET"
        }
        ```

- **manageVersions.js**

    - Adds a last modified date to a sample's sampleSummary document taken from the S3 object's metadata.

    - If a last modified date is already listed it is compared to the current date on the S3 object.

    - Objects where new versions are found have their data stashed in the sampleSummary document and votes reset in sampleCounts.

- **reconcileVotes.js**

    - Takes the votes document in firebase `db/datasets/{DATASET}/votes` as the source of truth and syncs sampleCounts, sampleSummary and userSeenSamples to all match with it.

    - Run without `confirm` to only view console output of differences. Run with `confirm` to update firebase.

    - Example run command `node reconcileVotes.js ABIDE1 confirm`

- **removeImageType.js**

    - Removes any image from Firebase in the specified study that matches the input pattern.

    - **USE WITH CAUTION.**

- **restore-sampleCounts.js**

    - Takes the sampleSummary document in firebase `db/datasets/{DATASET}/sampleSummary` and updates sampleCounts to restore data for any removed images.

    - Designed to restore the dataset in cases where some images have been temporarily removed from circulation.

    - Differs from reconcileVotes because reconcileVotes will not add new samples to sampleCounts to maintain the subset of images served to users.

- **updateSamplesFromS3.js**

    - Updates sampleCounts in Firebase based on an `s3cmd ls` to the s3 bucket/prefix for the specified dataset in the database config.
    
    - Excludes images determined in the configuration document for the study in firebase.
    
    - Reconciles votes for images that already have a document in `sampleSummary`

## Images
Tools in this directory are used to modify, move, or create images used in BrainSwipes.

- **anat_qc_s3_wrapper.py**

    - A python wrapper for the [hbcd_anat_qc](https://hub.docker.com/repository/docker/dcanumn/hbcd_anat_qc/general) container.

    - Use `./anat_qc_s3_wrapper.py -h` for argparse help for this script.

- **generate_manifest.sh**
 
    - A bash script that calls `s3cmd ls` and formats it into a manifest json for ingestion into BrainSwipes.

    - Manifest JSONs are the legacy way to upload data. It is recommended to use `updateSamplesFromS3` instead.

- **ingest_brainswipes_data.py**

    - Uses argparse. Intakes 3 required positional arguments: s3_subjects_path (path to subject s3 directories), imgs_path (path in subject directory where images are stored), destination (where to ingest the images, normally the `brainswipes` bucket)

        - Example command: `python ingest_brainswipes_data.py s3://study-bucket/derivatives/xcpd-v0.7.0/ figures/ s3://brainswipes/dataset-name/`
        - Run `ingest_brainswipes_data.py -h` for information on running this script and optional arguments.

    - Pulls data from the paths provided, filling in the subject ID: `s3_subjects_path + {{SUBJECTID}} + imgs_path`. The s3_subjects_path therefore needs to be the directory where the subject directories are stored. 

    - Resizes registrations for optimal rendering in BrainSwipes (no longer necessary for XCP-D, as they now create BrainSwipes specific pngs that are arranged correctly)

    - Uploads all relevant images to the S3 bucket specified

- **make_diffusion_gifs.py**

    - **DEPRECATED** 
    
    - Creates `.GIF` files from DWI images for use in BrainSwipes.

    - See the [version used in HBCD](https://github.com/DCAN-Labs/QSIPREP_HBCD_QC) for an up to date version.

    - Also available as [a container](https://hub.docker.com/repository/docker/dcanumn/qsiprep_qc/general).
