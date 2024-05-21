# Configuration

Configuration is located in Firebase in the `db/config` document. These variables can be updated quickly and without pushing code changes.

Dataset specific configuration is done here as well, this is where information is stored when you add a new study.

- allowedGlobusOrganizations
    - A list of all Globus organizations. Used in the admin/users page to select a user's organization.

- catchTrials
    - frequency
        - The chance a user is given a catch trial on any given swipe. Should be between 0 and 1. 
        - A setting of 0.05 would be a 1 in 20 chance the user is served a catch trial.

- datasets

    *Dataset specific configurations. Each dataset will have some or all of the following documents:*
    - about

        - Information about the study. This shows in the about section of the website. 

    - archived

        - Whether the dataset is archived. If true it can no longer be swiped on but its data is still viewable in other areas of the application

    - bucket

        - The MSI s3 bucket that the images are kept in.

    - exclusions

        *Rules for excluding files from being added to sampleCounts directly from the s3 bucket.*

        - fromTSV

            - A list of rules that use regex matching to exclude anything that matches a pattern in a TSV file.
                
                - `filterCol` should be the column that will have some identifier in it that marks the participant for exclusion

                - `idCol` will be the identifier for the participant that should be excluded. This will match a `sub-SUBJECT` portion of an image label.

                - `pattern` will be a regular expression to be matched. Strings in the `filterCol` that match the `pattern` regex will signal BrainSwipes to exclude the correspondaing subject. [regexpal](https://www.regexpal.com/) is a great resource for testing regular expressions.

            ```
            "fromTSV": {
              "rules": [
                {
                  "filterCol": "pscid",
                  "idCol": "participant_id",
                  "pattern": "^QI"
                }
              ],
              "s3path": "path/to/participants.tsv"
            },
            ```

        - substrings

            - A list of substrings that use substring matching to exclude any filenames where the pattern is found

            ```
            "substrings": [
              "InferiorTemporal-Cerebellum",
              "SubcortInAtlas",
              "AtlasInSubcort",
              "rest_acq-",
              "_ref"
            ]
            ```
            
    - imageType

        - Used to override the existing pattern matching method of determining and displaying image types throughout the app.

    - name

        - The name showed on the website. Different from the key of the record in config as the key does not allow special characters.

    - prefixes

        - A list of prefixes to be passed into the `ListObjectsV2Command` to reduce the number of objects returned. Recommended for buckets with lots of data not related to this dataset being ingested.

    - s3filepath

        - Filepath for finding images, both for displaying in the app and updating sampleCounts from the s3. {{SUBJECT}}, {{SESSION}}, and {{FILENAME}} will be replaced on a per image basis.

    - tutorials

        - Names of the tutorials required for this dataset. Keys should be true if required, can be left out if not.

- errorCodes

    - Keys are passed around by the app and then used to grab and display the values

- learn

    - checklists

        - Strings to display alongside checkboxes in the checklist component of the app

    - gallery

        - Filenames of images to display in the gallery. Keys are populated by the from end gallery add process

    - tutorials

        - The various tutorial modules in the Learn section of the app. The content key will determine what elements will appear in the tutorial page.

- studies
    
    *Configuration specific to a study. Each study has an entry with the following records:*

    - about

        - Information about the study. This shows in the about section of the website. 

    - available

        - Whether the dataset is open to the public. New users will see studies with ‘true’ by default. Any study with ‘false’ will require Globus authorization.
        - Changing this after creating a study will only modify the permissions of new users. To modify old users' permissions run `modifyUsers.js` in the tools folder.

    - datasets

        - A list of datasets in the study. Each dataset will appear in the datasets document of config where its attributes are defined.
