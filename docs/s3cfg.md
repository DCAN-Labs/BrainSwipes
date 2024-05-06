# Configuring S3 access

BrainSwipes uses the [AWS JavaScript SDK](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/welcome.html) to connect to S3. The server imports credentials from `s3-config.json` which is listed in the `.gitignore` file.
To construct this file you will first need to find the appropriate credentials.
BrainSwipes primarily uses MSI's S3 service, but can be configured to use other S3 endpoints.

## Getting S3 Credentials from MSI

BrainSwipes has been granted an S3 service account by MSI.
The sevice account's uid is **`77766`** and its sharing address is `specialsystemsperson+60@msi.umn.edu`.
The account is owned by Ben Lynch `blynch@umn.edu` the director of MSI.
Account credentials are reviewed and renewed in March of every year.
For help with the keys for this service account reach out to `help@msi.umn.edu`.
If you generate new keys for this service account be sure to update them in the `s3-config.json` on the AWS server.

### MSI S3 buckets

Below is a table showing buckets currently holding data used in BrainSwipes.

| S3 Bucket                | study                | notes                                              |
|--------------------------|----------------------|----------------------------------------------------|
| s3://brainswipes         | DCAN Managed studies | Studies split into first level directories         |
| s3://brainswipes-backups |           -          | Bucket that the script firebaseBackup.js pushes to |
| s3://midb-hbcd-main-pr   | HBCD                 | HBCD main study, T1/T2 and Diffusion               |
| s3://midb-hbcd-pilot-pr  | HBCD                 | HBCD pilot data, T1/T2 and Diffusion               |

If new buckets are needed, the BrainSwipes service account will need `s3:GetObject` and `s3:ListBucket` permissions.
It is recommended to not give this service account any other permissions, especially write permissions. In general ask for read only access with collaborators.
It is recommended to use the method [outlined here](https://www.msi.umn.edu/support/faq/how-do-i-use-s3-buckets-share-data-tier-2-storage-other-users) to update access.

Here is an example bucket policy for the bucket `brainswipes` that gives full access to someone managing the data (uid 77291) and read only access to the service account.

    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": [ "arn:aws:iam:::user/uid=77291" ]},
                "Action": [ "s3:*" ],
                "Resource": ["arn:aws:s3:::brainswipes/*", "arn:aws:s3:::brainswipes"]
            },
            {
                "Effect": "Allow",
                "Principal": {"AWS": [ "arn:aws:iam:::user/uid=77766" ]},
                "Action": [ "s3:GetObject", "s3:GetObjectVersion" ],
                "Resource": ["arn:aws:s3:::brainswipes/*"]
            },
            {
                "Effect": "Allow",
                "Principal": {"AWS": [ "arn:aws:iam:::user/uid=77766" ]},
                "Action": [ "s3:ListBucket" ],
                "Resource": ["arn:aws:s3:::brainswipes"]
            }
        ]
    }

## Setting up S3 Credentials for AWS

It is recommended to use MSI's S3 for storage for UMN based studies, but when working with collaborators you may not be able to move the image files there.

In order to configure BrainSwipes to access a public AWS bucket the owner will first have to make an IAM user for you and give it read only permissions for the bucket the images are in. Here is an example permissions json that can be used in the AWS management console:

    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "VisualEditor0",
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    "arn:aws:s3:::BUCKET-NAME/*",
                    "arn:aws:s3:::BUCKET-NAME"
                ]
            }
        ]
    }

The bucket owner will then need to provide the AWS access key and secret key for the IAM user. No other permissions or information is needed.

## Example s3-config.json

Credentials for S3 access are kept in the `s3-config.json`.
The credentials stored here are unique to each S3 account.
A default key is required. The default configuration points to MSI's S3 service using the BrainSwipes service account.
All MSI studies use the same configuration object to access data in S3 buckets regardless of the bucket the images are stored in.
You will only need to add a key to the config JSON when a new account is used.
Besides default, you may add any number of credential objects to this file.
This has been tested with AWS but any institution that uses the S3 paradigm can be included as long as you have access keys, an endpoint URL and a region.

    {
        "default": {
            "credentials": {
                "accessKeyId": <MSI-S3-ACCESS-KEY>,
                "secretAccessKey": <MSI-S3-ACCESS-SECRET>
            },
            "endpoint": "https://s3.msi.umn.edu",
            "region": "global"
        },
        "AWS1": {
            "credentials": {
                "accessKeyId": <AWS-S3-ACCESS-KEY>,
                "secretAccessKey": <AWS-S3-ACCESS-SECRET>
            },
            "endpoint": "https://s3.amazonaws.com",
            "region": "us-east-2"
        },
        "AWS2": {
            "credentials": {
                "accessKeyId": <ANOTHER-AWS-S3-ACCESS-KEY>,
                "secretAccessKey": <ANOTHER-AWS-S3-ACCESS-SECRET>
            },
            "endpoint": "https://s3.amazonaws.com",
            "region": "us-east-1"
        }
    }

## Firebase Configuration

A dataset can be configured to use any account listed in the `s3-config.json` in firebase.
In the dataset's config (`database/config/datasets/DATASET-NAME`) add a `s3cfg` key with the value that matches a key in the JSON.

For example to configure use of the AWS1 credentials in the above example, add `s3cfg: AWS1` to the dataset config.
