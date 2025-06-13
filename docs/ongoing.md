# Example Configuration for Ongoing Studies

This page outlines a set of configurations for use with ongoing studies.
If your study is still collecting data and want BrainSwipes to update as new images are generated, follow this configuration.


## S3 Access
This paradigm assumes your data is being added to an S3 bucket specific to that study. You will not be copying images into a different s3 bucket.

You will need to have the bucket owner give the BrainSwipes service account **read only access** to the study bucket. For information on setting read only access to a bucket, see [the S3 page](s3cfg.md).

This paradigm assumes your data is in a consistent directory structure. If you use the [BIDS standard](https://bids.neuroimaging.io/), you're all set!


## Setting Dataset Config in Firebase

This configuration relies on 4 keys in the dataset's config object in firebase. For more information about dataset configuration, see [the configuration page](configuration.md).

1. `bucket`
    - The name of the S3 bucket the data is in. This is standard and will be set when the dataset is initialized in BrainSwipes
1. `exclusions`
    - This is a way to exclude images that you don't want to be ingested into BrainSwipes. By default BrainSwipes will ingest all files with the file suffix you indicate in the `s3filepath` key.
    - You can exclude images by: 
        - matching substrings in the `subtrings` key
        - parsing a TSV file in the `fromTSV` key (see [configuration](configuration.md))
1. `prefixes`
    - This narrows down the search criteria for new images. If your s3 bucket has lots of objects it is recommended you use this key
1. `s3filepath`
    - The regular path in the S3 bucket where images will be found.
    - `{{SESSION}}`, `{{SUBJECT}}`, and `{{FILENAME}}` will be replaced using regex to find matching files.

Below is an example JSON object from Firebase highlighting the relevant keys:

    {
        "bucket": "my-study-bucket",
        "exclusions": {
            "substrings": [
                "SagittalCorpusCallosum",
                "desc-mosaic",
                "AxialInferiorTemporalCerebellum",
                "_bold"
            ]
        },
        "prefixes": [
            "derivatives/ses-V03/xcp_d/",
            "derivatives/ses-V02/xcp_d/"
        ],
        "s3filepath": "derivatives/{{SESSION}}/xcp_d/{{SUBJECT}}/figures/{{FILENAME}}.png",
    }

## Setting a cronjob

With the above configurations set, running the script `updateSamplesFromS3.js` will find all desired images.
For users of MSI, it is recommended to use [scrontab](https://cdnis-brain.readthedocs.io/scron/) which mimics a cronjob but lets you leverage SLURM. Cronjobs let you run commands at regularly scheduled times.

Here is an example of the scrontab:

    #SCRON --time=30:00
    #SCRON --mem=10g
    #SCRON --tmp=10g
    #SCRON --mail-type=ALL  
    #SCRON --mail-user=your-email@umn.edu
    #SCRON -J BrainSwipes-cronjob
    #SCRON -A <group-name>
    #SCRON -o /path/to/logs/%A_brainswipes-cronjob.out

    0 14 * * * /path/to/scron.sh


and an example script the scrontab runs:

    #!/bin/bash -l        

    module load nodejs
    /path/to/BrainSwipes/tools/database/updateSamplesFromS3.js DatasetName1
    /path/to/BrainSwipes/tools/database/updateSamplesFromS3.js DatasetName2