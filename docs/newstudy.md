# Adding New Studies to BrainSwipes

## New Study Request Form

In accordance with the vision of BrainSwipes we are interested in helping members of the neuroimaging community QC their data.
To manage these requests we recommend having collaborators fill out [this google form](https://forms.gle/jZMfSXDFnth6efWg6) to scope their needs and track their request.

## Initializing the Study in BrainSwipes

*Only a site-wide admin can add a new study to BrainSwipes.*

 1. Under the `Admin` route select `Manage Database`
 1. Select `Create New`
 1. Select `New Study`
 1. Fill out the form
    - Name of Study 
      - should be an abbreviation 5 letters or less
    - Name of Dataset
      - can be the same name as the study, but if you plan on having different versions of the data or kinds of images it should be more descriptive.
    - Name of MSI S3 Bucket where the data will be held
      - without the `s3://` prefix
    - Choose restricted or open
 1. Submit!

If a study is manually entered into the database no custom claims will be set, and no users will be able to access or manage this data.

## Choose what types of images to use

The most common use case involves pulling images from the executive summary. Several studies have used unprocessed images, QSI prep images and more. More image types are being developed and and kind of image can be served in the BrainSwipes application as long is they are easily renderable in a broswer (e.g. `.PNG` or `.GIF` files)

## Populate the Database

BrainSwipes randomly selects images to serve a user by looking through entries in the study's database documents. An image needs to exist in the dataset's S3 bucket and referenced in Firebase.

### Put your images in an S3 Bucket

Images can be placed in an S3 bucket either nested in a consistent directory structure or all in the same directory.

### Tell Firebase where to find the images

Images can be added to the database in several ways.

1. Images can be automatically detected with the `updateSamplesFromS3.js` script located in the tools directory.
    - This is the recommended option. Requires some configuration.
1. Images can be ingested by feeding the application a `manifest.json` in the `Admin` -> `Manage Database` route.
    - Legacy method. Can take a long time.
    - manifest json files are simply a list of filenames seperated by commas 

    `manifest.json`:

    ```
    [
        image-name1.png,
        image-name2.png,
        ...
        image-name998.png,
        image-name999.png
    ]
    ```

1. Images can be manually added to Firebase. Edit the `datasets/{{DATASET-NAME}}/sampleCounts` document with a list of key-value pairs where each key is a filename without the file extension and each value is `0`.
    ```
    sampleCounts    
    ├──sub-999999_ses-test_T1-Axial: 0
    └──sub-999999_ses-test_T2-Coronal: 0
    ```