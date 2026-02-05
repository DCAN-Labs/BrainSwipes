# Manipulating Existing Datasets

## The TEST Study

TEST is a study that is hidden from most users. Only users who are given access to this study will be able to see it.

If datasets need to be taken down temporarily while an issue is resolved it is recommended to move the dataset to this study.

## Moving Datasets

Datasets are associated with a study in the study config in Firebase, `database/config/studies/datasets`

To move a dataset, add the key associated with it in the datasets config to the list of studies in the datasets key of the study config, then remove it from the old study.

## Deleting Datasets

Datasets can be taken down by removing them from the list in the study config. If they are not associated with a study they will not appear in the app. Data can be left in the database for future use, or removed. Data will persist in database backups.

If you would like to be able to see a dataset's visualizations and results in BrainSwipes but stop users from swiping on it, it can be archived through the Admin route by selecting Manage Database. It's button will appear gray and send the user to its about page where it will say the dataset is archived.

## Deleting Studies

A study can be removed by deleting its document in the study config. The study will still have custom claims in firebase, so it is recommended to remove those from all users, unless the study will be put back up soon. Use the script `modifyUsers.js` to do this. It will require some hands on edits to run for your needs.