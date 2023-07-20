#!/bin/bash

# s3 paths
basepath="s3://ABCC_year2_derivatives/derivatives/abcd-hcp-pipeline-v0.1.3/"
ses="ses-2YearFollowUpYArm1/"
folder="executivesummary/"
newbucket="s3://swipes-abcd"

# get subjects from file with list of subjects
file="abcc.txt"
subjects=$(cat $file)

# start counter
total=$(echo $(wc -l $file | awk '{ print $1 }'))
i=0
for sub in $subjects
do
    # identify s3 path and make destination folder
    echo "$sub"
    path="$basepath$sub$ses$folder"
    echo "$path"
    echo $(mkdir $sub)
    # get files from s3
    echo $(s3cmd get --recursive $path $sub)
    # convert to swipes format
    echo $(./bulk_es2sfs.sh $sub)
    # push to new bucket
    files="${sub}/sub-*.png"
    echo $(s3cmd put --recursive $files $newbucket)
    # clean up and log progress
    echo $(rm -rf $sub)
    ((i=i+1))
    echo "completed ${i} of ${total}"
done