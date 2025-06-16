# BrainSwipes' Database

BrainSwipes uses a [Firebase Realtime Database](https://firebase.google.com/docs/database) to store its data.
Realtime database data is stored on the google cloud in a large JSON.


## config
This document stores configurations for the app.

- **allowedGlobusOrganizations**: List of strings
    - These are the organizations that have an authentication service connected to Globus. Used to match users with their organization during dataset registration and authentication. 

- **catchTrials**: Contains dictionary of catch trial configuration

    - *frequency*: 
        How often a catch trial should be served. Should be a number between 1 and 0. For instance, 0.05 = 1/20, a user will recieve a catch trial approximately one in 20 samples. This process is random and checks if a random number is less than the number defined here. `Math.random() < this.config.catchTrials.frequency`

- **datasets**: Dictionary of dataset information
    - Top-level key is the name of a dataset. Under each dataset are a number of keys which store information about the dataset that is used to display information on BrainSwipes and tells Firebase where to grab images from. You can read more about the keys on the [configuration page](configuration.md)

- **errorCodes**: Dictionary
    - Key is short error, value is longer error messages. Primarily used in Globus Auth.

- **imageTypes**: Dictionary 
    - Key is short name, value is longer name that is displayed. Determines the image type for various help and data visualization features (i.e. showing what type of image it is when selecting the "Help" button). If not overridden in a dataset's configuration, will default to func, anat or atlas based on pattern matching.

- **learn**: Dictionary 
    - Stores information for the Learn tab of BrainSwipes, which has the Tutorials and Gallery pages.
    - *checklists*: Checklists used in various help related features. Each checklist corresponds to an imageType and is a list of strings. These strings are the primary qualities the image should be rated on. 

    - *gallery*:
    Keys are sample names. Each sample name configures an image for the gallery. You can read more about the gallery section on the [configuration page](configuration.md)

    - *tutorials*:
    Each key contains information for the identified tutorial.

- **profilePics**: List of strings. 
    - Each string is a the name of a `.SVG` file in `static/profile_pics` available to be used as a profile picture.

- **studies**: Dictionary of study information.
    - Read more on the [configuration page](configuration.md)

## datasets
Each dataset has a document here. This is where the samples, votes, and chats are tracked

- **catch**: Dictionary of catch trial information
    - Tracks which images are catch trials and their rating, as well as how people are voting on them.
    - Contains *sampleCounts*, *sampleSummary*, *userSeenSamples*, and *votes* keys, which are mostly the same as the base keys listed below.
    - The *sampleCounts* key here is the catch trial image and the value indicates whether it should be passed or failed.

- **chats**: Dictionary (incredibly nested) 
    - Tracks images with chats and which users left the chat to notify when the image is chatted on in the future (not sure if this notification system is functional).

- **flaggedSamples**: Dictionary
    - Key of image filename and value is which user flagged them.

- **sampleCounts**: Dictionary
    - Keys of images currently available to swipe, value is the number of times any user has seen the image.

- **sampleSummary**: Dictionary
    - Keys of any image that has been in the dataset. Value is dictionary with keys of the average vote (*aveVote*) and total number of votes (*count*) for images in the dataset. An image that used to be in the dataset but was removed will still appear here.

- **userSeenSamples**: Dictionary 
    - Key is username, value is dictionary that tracks which samples a user has seen and how many times. Used in prioritizing samples that a user swipes on.

- **votes**: Random hash
    - Uses firebase's push method to generate a unique key that holds the data for a single vote.
        - *response*:
        What the user responded.
        0 for fail, 1 for pass.

        - *sample*:
        The name of the sample

        - *time*:
        The number of milliseconds between loading the image and the user swiping on it

        - *user*:
        The username of the user that cast this vote.

## log
Various logging from the application.

-  **console**: Random hash 
    - Routes console log and error statements to the database. Shows the statement, username and datetime string.

- **globusAuthentication**: Random hash 
    - Logs the information sent by Globus when a user authenticates with it.

- **serverErrors**: Random hash
    - Logs errors generated when running server functions.

- **userManagement**: Random hash
    - Every time a user's permissions are updated a log is added here. Shows which user is updated and who updated them

## requests
Lists each private study and which users have requested access to them. This can be managed in the admin dashboard on the BrainSwipes webpage. Shows data collected during form submission as well as the request's status. Is hidden if accepted.

## users
Each user has their own document in this section which stores information on their BrainSwipes activity.

- **consent**: Boolean
    - Marked as true when a user consents during account creation.

- **consentedOn**: Datatime 
    - Datetime that the user consented on during account creation

- **datasets**: Dictionary 
    - Key-value pairs of dataset name with score and catch. Scores are how many times the user has swiped on the dataset. Catch is the success of the last 5 catch trials this user swiped on in this dataset.

- **pic**: String
    - The user's profile picture

- **score**: Integer
    - Total number of swipes completed across all datasets and catch trials.

- **tutorials**: Dictionary
    - Lists all tutorials taken by the user with "complete" as the value.
