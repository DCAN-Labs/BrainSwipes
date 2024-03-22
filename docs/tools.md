# Tools

A description of scripts in the tools folder.

Scripts may require `brainswipes-firebase-adminsdk.json` or `brainswipes-rtdb-token.json` to run.
To generate these JSONs visit the Firebase console. Put them in the top level directory where they will be git ignored.

#### Database Interactions
- reconcileVotes.js

    - Takes the votes document in firebase `db/datasets/{DATASET}/votes` as the source of truth and syncs sampleCounts, sampleSummary and userSeenSamples to all match with it.
    - Run without `confirm` to only view console output of differences. Run with `confirm` to update firebase.
    - Example run command `node reconcileVotes.js ABIDE1 confirm`

- removeImageType.js

    - Removes any image from Firebase in the specified study that matches the input pattern.

    - **USE WITH CAUTION.**

- restore-sampleCounts.js

    - Takes the sampleSummary document in firebase `db/datasets/{DATASET}/sampleSummary` and updates sampleCounts to restore data for any removed images.
    - Designed to restore the dataset in cases where some images have been temporarily removed from circulation.
    - Differs from reconcileVotes because reconcileVotes will not add new samples to sampleCounts to maintain the subset of images served to users.


#### Making Images
- make_diffusion_gifs.py

    - Script used to make gifs for DWI images, one subject at a time.
    - See the [version used in HBCD](https://github.com/DCAN-Labs/QSIPREP_HBCD_QC) for more advanced usage.

- ingest_brainswipes_data.py

    - Pulls executive summary images from the specifed input S3 location
    - Transforms executive summary images that appear in a 1x9 grid to the 3x3 grid seen in BrainSwipes
    - Uploads all `.png` files to the specifed output S3 location
    - Once images are in the S3, configure the database uploads in the config document of firebase and run `s32firebase.js`

- generate_manifest.sh

    - generates a manifest JSON used by the legacy uploading option from the original SwipesForScience.
    - may be useful for large datasets as the s3 interactions used in `s32firebase.js` can take a lot of memory.


#### User management

- modifyUsers.js

    - Various functions to help manage user info that is only accessible through the Firebase Admin SDK.
    
    - Inputs are hard coded, will need manual intervention to use.

    - Use `updateCustomClaims()` to modify users permissions when changing any part of a dataset's configuration that effects custom claims.


#### General Upkeep

- s32firebase.js

    - Updates sampleCounts in Firebase based on an `s3cmd ls` to the s3 bucket for the specified study.
    - Designed for use on the production server as a cronjob to update studies regularly. `crontab -e` to view and edit cronjobs using vim.
    - Example command: `node s32firebase.js BCPv101 localhost 8080`
        - hostname + port will generally be `localhost 8080` if running a dev server (`npm run dev`) or `localhost 3000` for a production server (on AWS)

- firebaseBackup.js

    - Pulls all data from firebase as a JSON file and puts it into `s3://brainswipes-backups`
    - Takes too much RAM to be run on Lightsail. Run regularly on your local machine to back up data.