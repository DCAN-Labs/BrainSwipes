# MSI S3
Images are stored on MSI Tier 2 storage. 
The application uses the [JavaScript AWS SDK](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/welcome.html) to pull images from these buckets.
The application uses a service account that needs **read only** access to buckets with images to be used in the app. It is recommended to use the method [outlined here](https://www.msi.umn.edu/support/faq/how-do-i-use-s3-buckets-share-data-tier-2-storage-other-users) to update access.
The BrainSwipes service account's UID is **77766**

Here is an example bucket policy for the bucket `brainswipes` that gives full access to someone managing the data (uid 77291) and read only access to the service account.
```
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

```

#### List of S3 buckets used by BrainSwipes

| S3 Bucket                | study                | notes                                              |
|--------------------------|----------------------|----------------------------------------------------|
| s3://brainswipes         | DCAN Managed studies | Studies split into first level directories         |
| s3://brainswipes-backups |           -          | Bucket that the script firebaseBackup.js pushes to |
| s3://hbcd-main-study     | HBCD                 | HBCD main study, T1/T2 and Diffusion               |
| s3://midb-hbcd-pilot-pr  | HBCD                 | HBCD pilot data, T1/T2 and Diffusion               |

