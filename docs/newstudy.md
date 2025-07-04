# Adding New Studies to BrainSwipes

## New Study Request Form

In accordance with the vision of BrainSwipes we are interested in helping members of the neuroimaging community QC their data.
To manage these requests we recommend having collaborators fill out [this google form](https://forms.gle/jZMfSXDFnth6efWg6) to scope their needs and track their request.

## Organize the Database

See [Available Image Types](imagetypes.md) to understand what types of images BrainSwipes can display.

BrainSwipes randomly selects images to serve a user by looking through entries in the study's database documents. An image needs to exist in the dataset's S3 bucket and referenced in Firebase.

If data for your study is still being collected and you want BrainSwipes to automatically update as new images are generated, see our [example configuration for ongoing studies](ongoing.md).

Images can be placed in an S3 bucket either nested in a consistent directory structure or all in the same directory.

If you are setting up a BrainSwipes study for an outside collaborator (i.e. images stored in an S3 bucket outside of MSI), you'll need to have the collarborator generate s3 credentials for you so that BrainSwipes can access the bucket. You'll add these to the `s3-config.json` file. 

## Initializing the Study in BrainSwipes

*Only a site-wide admin can add a new study to BrainSwipes.*

 1. Under the `Admin` tab select `Manage Database`
 2. Select `Create New`
 3. Select `New Study`

    - If you're adding a dataset to a pre-existing Study, select `Existing Study`

 4. Fill out the form
    - Name of Study 

      - Should be an abbreviation 5 letters or less

    - Name of Dataset

      - Can be the same name as the study, but if you plan on having different versions of the data or kinds of images it should be more descriptive.

    - Name of S3 Bucket where the data will be held

      - Without the `s3://` prefix

    - Choose restricted or open
 5. Submit!

Now you should identify tutorial modules that users will be required to complete before accessing this dataset.

 1. Under the `Admin` tab select `Manage Database`
 2. Select `Modify Existing`
 3. Select the study and dataset
 4. Select `Select Tutorials`
 5. Click on tutorials to set them as required.

    - Every dataset should have the `Introduction to BrainSwipes` and `Current Bugs` tutorials. 

If a study is manually entered into the database no custom claims will be set, and no users will be able to access or manage this data.

## Update the Firebase Config

There are several keys that can effect the how BrainSwipes tracks references to S3 images in firebase. To configure these in Firebase, go to `database/config/datasets/{{DATASET}}`.

- **bucket**:
This should be already be set by the initial configuration. If you change the bucket you will be storing images for this dataset, edit it here. 
It is recommended to use the bucket `brainswipes` for all datasets that do not otherwise need their own bucket.

- **exclusions**:
This can be used to narrow down the images to be served to users. It filters files based on patterns in the filename. See the exclusions section of [configurations](configuration.md) for more details.
If you are using a dataset from an executive summary include the exclusions in the example below.

  - The exclusions you will use from executive summary pipelines will vary depending on what version of the pipeline has been used. See the [configuration page](configuration.md)) for more details on commonly used exclusions for different pipelines/versions.

- **prefixes**:
A list of prefixes to narrow down the searching of images in the S3 bucket. Think of these as directories inside the S3 where images for this study are stored.
Including these expediates the search for files when using `updateSamplesFromS3.js`. While not strictly necessary, if not included large buckets may cause the script to timeout.

- **s3filepath**:
If your image files are not in a flat structure at the base of an s3 bucket then you will need to change this. see [configurations](configuration.md) for more information.

- **s3cfg**:
If your study is using an S3 bucket not hosted by MSI, you'll need to specify which section of the `s3-config.json` to use for s3 credentials. The `default` section is used automatically if a different label is not specified.

Example configuration:

    {
      "bucket": "brainswipes",
      "exclusions": {
        "substrings": [
          "SagittalCorpusCallosum",
          "AxialInferiorTemporalCerebellum",
          "_bold",
        ]
      },
      "prefixes": [
        "BCP/"
      ],
      "s3filepath": "BCP/{{FILENAME}}.png"
    }


## Tell Firebase where to find the images

Images can be added to the database in several ways.

1. Images can be automatically detected with the `updateSamplesFromS3.js` script located in the tools directory.
    - **This is the recommended option**. Requires the four configurations from the example listed above. See [tools](tools.md) for more information on this script.

    - If you are ingesting a study from an outside S3 bucket, you'll need to edit [line 49](https://github.com/DCAN-Labs/BrainSwipes/blob/aa64b4c228ae0677f4c73636ef83765a43ebb5fe/tools/database/updateSamplesFromS3.js#L49) to specify the label you added to the `s3-config.json`. 
2. Images can be ingested by feeding the application a `manifest.json` in the `Admin` -> `Manage Database` route.
    - Legacy method. Can take a long time.
    - Manifest json files are a list of filenames seperated by commas
    - Do not include file extensions on the filenames eg `image-file1` not `image-file1.png`

    `manifest.json`:

        [
            image-name1,
            image-name2,
            ...
            image-name998,
            image-name999
        ]

3. Images can be manually added to Firebase. Edit the `datasets/{{DATASET-NAME}}/sampleCounts` document with a list of key-value pairs where each key is a filename without the file extension and each value is `0`.

        sampleCounts    
        ├──sub-999999_ses-test_T1-Axial: 0
        └──sub-999999_ses-test_T2-Coronal: 0
