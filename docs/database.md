# BrainSwipes' Database

BrainSwipes uses a [Firebase Realtime Database](https://firebase.google.com/docs/database) to store its data.
Realtime database data is stored on the google cloud in a large JSON.


# config
This document stores configurations for the app.

## allowedGlobusOrganizations
A list of strings. These are the organizations that have an authentication service connected to Globus.
Used to match users with their organization during dataset registration and authentication. 

## catchTrials
Catch trial configuration

- **frequency**
How often a catch trial should be served. Should be a number between 1 and 0.
For instance, 0.05 = 1/20, a user will recieve a catch trial approximately one in 20 samples.
This process is random and checks if a random number is less than the number defined here.

`Math.random() < this.config.catchTrials.frequency`

## datasets

Each key in this document is the name of a dataset. Under each dataset are a number of keys, some of which are optional.

- **about**:
**REQUIRED**

- text:
A list of strings. Each string is a new line in the dataset's about description in the parent study's about page.
When a new dataset is made in the admin dashboard, this defaults to placeholder text saying an admin will update it.
Must be manually changed in Firebase.

- **archived**:
Boolean. If `true`, the dataset cannot be swiped on but is still visible in the app.

- **bucket**:
**REQUIRED**
The S3 bucket on MSI that images for this dataset are stored in.

- **exclusions**:

- fromTSV:
rules for filtering based on a TSV file and s3path to find the TSV file in the dataset's bucket.
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

- substrings:
List of strings.
Each string should be a pattern that when matched will exclude the sample from being added automatically to the dataset if found in the S3 bucket.

- **imageType**:
Determines the image type for various help and data visualization features.
If not included, will default to func, anat or atlas based on pattern matching.
See config/imageTypes for possible options.

- **name**:
**REQUIRED**
The name for this dataset displayed in the app

- **prefixes**:
List of strings.
Filepaths relative to the S3 bucket to check for data when searching with `updateSamplesFromS3.js`

- **s3filepath**:
Where in the s3 bucket files are found. Used in searching for and rendering images.
Replaces `{{SUBJECT}}`, `{{SESSION}}`, and `{{FILENAME}}` with the subject session and filename for a specific sample.
If not included the application looks for images at the base level of the s3 bucket.

- **tutorials**:
**REQUIRED**
Which tutorial modules are required before swiping on this dataset.
Can be set in the admin dashboard.

## errorCodes

Key Value pairs that match short error with longer error messages. Primarily used in Globus Auth

## imageTypes

Determines the image type for various help and data visualization features.
If not overridden in a dataset's ocnfiguration, will default to func, anat or atlas based on pattern matching.

## learn

- **checklists**:
Checklists used in various help related features. Each checklist corresponds to an imageType and is a list of strings.

- **gallery**:
Keys are sample names. Each sample name configures an image for the gallery. 
Select images for the gallery in admin actions in the review route, populate the gallery item in gallery.

See example

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
        "text": "Dimness is a result of generating an image for QC and does not reflect the quality of the data. If all other criteria are met, dim images should be passed."
    }

- **tutorials**:
Each key contains information for the identified tutorial.

## profilePics
List of strings. Each string is a the name of a `.SVG` file in `static/profile_pics` available to be used as a profile picture.

## studies
Configuration for each study.

- **about**:
Logo, text and title used in the about page for this study.

- **available**:
Boolean. Whether the study is accesible to the public.

- **datasets**:
List of strings. Which datasets are associated with the study.

# datasets
Each dataset has a document here. This is where samples and votes are tracked

## catch
Tracks the same data as tracked in a normal vote but kept here.

- sampleCounts
Whether each catch trial should be passed or failed.

## chats

Chats on samples in the dataset. Also tracks users to notify when the image is chatted on in the future.

## flaggedSamples
List of samples that are flagged and which user flagged them.

## sampleCounts

Each image that is currently swipeable in the dataset is included here. The number paired with that image is the number of times any user has seen the image.

## sampleSummary

Holds the average vote and total number of votes for images in the dataset.
An image that used to be in the dataset but was removed will still appear here.

## userSeenSamples

Tracks which samples a user has seen and how many times. Used in prioritizing samples that a user swipes on.

## votes

Uses firebase's push method to generate a unique key that holds the data for a single vote.

- **response**:
What the user responded.
0 for fail, 1 for pass.

- **sample**:
The name of the sample

- **time**:
the number of milliseconds between loading the image and the user swiping on it

- **user**:
the username of the user that cast this vote.

# log
Various logging from the application.

## console
Routes console log and error statements to the database. Shows the statement, username and datetime string.

## globusAuthentication
Logs the information sent by Globus when a user authenticates with it.

## serverErrors
Logs errors generated when running server functions.

## userManagement
Every time a user's permissions are updated a log is added here. Shows which user is updated and who updated them

# requests
Access requests for private studies. Managed in the admin dashboard.
Each study has its own document with one document per user.
Shows data collected during form submission as well as the request's status. Is hidden if accepted.

# users
Each user has their own document in this section.

## consent
Marked as true when a user consents during account creation.

## consentedOn
datetime that the user consented on during account creation

## datasets
scores broken down by dataset and success of the last 5 catch trials this user swiped on in this dataset.

## pic
The user's profile picture

## score
Total number of swipes completed across all datasets and catch trials.

## tutorials
Lists all tutorials taken by the user.
