# Configuration

Configuration is located in Firebase in the `db/config` document. These variables can be updated quickly and without pushing code changes. This page will only cover sections of the config that can and/or should be changed for dataset specific configuration. See the [database structure](database.md) page for more information on other keys in the database. 

## catchTrials
- *frequency*
    - The chance a user is given a catch trial on any given swipe. Should be between 0 and 1. 
    - A setting of 0.05 would be a 1 in 20 chance the user is served a catch trial.
    - This is not dataset specific, so if you change this value you will be changing the catch trial frequency for all of the studies.

## datasets
Dataset specific configurations. The REQUIRED sections are the sections that you will definitely need to adjust for every new dataset. The SUGGESTED sections are sections that won't necessarily need to be changed/created for every study but you'll want to verify that is the case for the study. Each dataset will have some or all of the following sections: 

- **about: REQUIRED**  
    - Information about the study. This shows in the about section of the website. 

    - *text*:
    A list of strings. Each string is a new line. When a new dataset is made in the admin dashboard, this defaults to placeholder text saying an admin will update it. Must be manually changed in Firebase.

- **archived**: 
    - Boolean. If `true`, the dataset cannot be swiped on but its data is still visible in the app.

- **bucket: REQUIRED** 
    - The S3 bucket that images for this dataset are stored in. This should not have the `s3://` prefix in it or any paths to a subfolder in the bucket. 

- **exclusions: SUGGESTED** 
    - Rules for excluding files from being added to sampleCounts directly from the s3 bucket. There are two options for exclusions.

    - *fromTSV*: Rules for filtering based on a TSV file and s3path to find the TSV file in the dataset's bucket.
        - `filterCol` should be the column that will have some identifier in it that marks the participant for exclusion

        - `idCol` will be the identifier for the participant that should be excluded. This will match a `sub-SUBJECT` portion of an image label.

        - `pattern` will be a regular expression to be matched. Strings in the `filterCol` that match the `pattern` regex will signal BrainSwipes to exclude the correspondaing subject. [regex101](https://regex101.com/) is a great resource for testing regular expressions.

    See example

        ```
        {
            "rules": [
                {
                "filterCol": "pscid",
                "idCol": "participant_id",
                "pattern": "^TI"
                }
            ],
            "s3path": "assembly_bids/participants.tsv"
        }
        ```

    - *substrings*: A list of substrings that use substring matching to exclude any filenames from being added automatically to the dataset where the pattern is found in the S3 bucket.
        - These strings will be different depending on what pipeline and pipeline version the data was processed with. 

- **imageType**: 
    - Used to override the existing pattern matching method of determining and displaying image types throughout the app. If not included, will default to func, anat or atlas based on pattern matching. See `config/imageTypes` for possible options.

- **name: REQUIRED** 
    - The name for this dataset displayed in the app. Can be different from the key of the dataset in the config as the key cannot have special characters. 

- **prefixes: SUGGESTED**
    - A list of prefixes to be passed into the ListObjectsV2Command to reduce the number of objects returned. Recommended for buckets with lots of data not related to this dataset being ingested. For example, if your images are all stored in a subdirectory named `derivatives`, you would enter `derivatives/`. This will make it so when searching with `updateSamplesFromS3.js`, the script only looks under the `derivatives` subfolder instead of searching through the entire bucket. 

- **s3filepath: REQUIRED**
    - Filepath to where in the s3 bucket files are found. Do not include the bucket name. Used in searching for and rendering images. The ingestion script will replace `{{SUBJECT}}`, `{{SESSION}}`, and `{{FILENAME}}` with the information for a specific sample. If not included the application looks for images at the base level of the s3 bucket. 

- **tutorials: REQUIRED** 
    - Which tutorial modules are required before swiping on this dataset. Can be set in the admin dashboard on the website. Keys should be true if required, and can be left out if not.

- **s3cfg**:
    - Only for studies hosted on non-MSI buckets. Specifies which AWS credentials to use based on the label name in `s3-config.json`.

## learn
Stores information displayed on the Tutorial and Gallery pages (hidden under the Learn tab on the website). If you need to update or create a new tutorial or add information about a gallery image, this is where it will be done. 

Please note that any images on the Tutorial or Gallery pages will not display if they are trying to grab the image from a restricted study due to PHI considerations. We have created a hidden study called LearnExamples to store images for the tutorial and gallery pages. This also prevents images from disappearing if the dataset structure were to change (i.e. we lose access to the bucket, filenames are changed, data is moved around, etc). There are two datasets under LearnExamples: TutorialGalleryImages (for .png images) and DWIgifs (for .gif files). Any image that needs to be added to a tutorial or a gallery will need to have the subject and session information stripped from the filename and added to `s3://brainswipes/learn-images/`. Once you add the images, you'll need to run the updateSamples script to push them to BrainSwipes. 

- **checklists**
    - Strings to display alongside checkboxes in the checklist component of the app (on the Help page and throughout the Gallery and Tutorial pages). Each checklist corresponds to an imageType and is a list of strings specifing which metrics to rate the image on.

- **gallery**
    - Filenames of images to display in the gallery. 
    - To add an image to the gallery, you need to be an admin. Select the Help button on an image, select admin actions, and select add to gallery. The only information that is automatically populated when you add an image to the gallery is the *dataset*, *study*, and *hidden* (which will automatically be true if its from a restricted study). 

    - Below is an example of a filled out gallery entry:

        ```
        {
            "answer": 1,
            "checks": [
                true,
                true,
                true
            ],
            "dataset": "ABIDE1",
            "hidden": false,
            "label": "Dim Images",
            "study": "ABIDE",
            "text": "Dimness is a result of generating an image for QC and ..."
        }
        ```

- **tutorials**

    - The various tutorial modules in the Learn section of the app. The content key will determine what elements will appear in the tutorial page. See the [configuring tutorials](tutorials.md) page for more information on how these are set up.

## studies
    
Configuration specific to a study. Each study has an entry with the following records:

- **about**

    - Information about the study for the about page. *Logo*, *text* and *title* keys.

- **available**

    - Boolean indicating whether the dataset is open to the public. New users will see studies with `true` by default. Any study with `false` will require Globus authorization.
    - Changing this after creating a study will only modify the permissions of new users. To modify old users' permissions run `modifyUsers.js` in the tools folder.

- **datasets**

    - A list of datasets associated with the study. Each dataset will appear in the datasets document of config where its attributes are defined.
