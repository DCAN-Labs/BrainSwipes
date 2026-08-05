import pandas as pd
import json
import re

# Author: rae McCollum
# Purpose: Remove invalid samples from a BrainSwipes Firebase config file. Assuming config file from firebase_db/datasets/<study>/. Multiple methods to choose from: 
# - ingest a list of valid or invalid subjects IDs (to remove excluded/removed subjects)
# - ingest a list of valid image paths (to remove deleted images) 
# - assign a list of excluded strings (to remove images with substrings that shouldn't be included). 
# NOTE: THIS SCRIPT IS HARDCODED, meaning there are no input arguments, everything must be assigned within the script before running. 
# Last Updated: 5 Aug 2026

def read_in_config(config_path):
    with open(config_path, 'r') as config_file:
        config = json.load(config_file)
    return config

def determine_valid_subjects(counts_df, subject_path): 
    # Takes in a subject list and removes any images that don't have a valid subject ID in the name
    valid_subjects_df = pd.read_csv(subject_path,names=["subject"])
    # valid_subjects_df["subject"] = valid_subjects_df["subject"].apply(lambda x: str(x))
    # ^^ Needed for if subject list doesn't have "sub-" prefix ^^
    # print(valid_subjects_df)
    valid_subjects = valid_subjects_df["subject"].tolist()

    clean_df = pd.DataFrame()
    for index,row in counts_df.iterrows():
        if any(string in row[0] for string in valid_subjects):
            new_row = pd.DataFrame({"png":[row[0]],"val":[row[1]]})
            clean_df = pd.concat([clean_df,new_row], ignore_index=True)
    updatedCounts = dict(clean_df.values)
    print("Number of updatedCounts:", len(updatedCounts.keys()))
    return updatedCounts

def remove_specific_subjects(counts_df, subject_path): 
    # Takes in a subject list and removes any images that have a subject ID overlapping with the list
    bad_subjects_df = pd.read_csv(subject_path,names=["subject"])
    # valid_subjects_df["subject"] = valid_subjects_df["subject"].apply(lambda x: str(x))
    # ^^ Needed for if subject list doesn't have "sub-" prefix ^^
    # print(valid_subjects_df)
    bad_subjects = bad_subjects_df["subject"].tolist()

    clean_df = pd.DataFrame(columns=["png","val"])
    for index,row in counts_df.iterrows():
        # print(row)
        if not any(string in row[0] for string in bad_subjects):
            new_row = pd.DataFrame({"png":[row[0]],"val":[row[1]]})
            clean_df = pd.concat([clean_df,new_row], ignore_index=True)
    # print(clean_df)
    updatedCounts = dict(clean_df.values)
    print("Number of updatedCounts:", len(updatedCounts.keys()))
    return updatedCounts

def determine_valid_images(counts_df, image_path):
    # Takes in list of valid images (for example, the images that live in an s3 bucket) and removes any images not on that list
    valid_images_df = pd.read_csv(image_path, names=["image"])
    valid_images_df = valid_images_df.replace(".png",'', regex=True)
    valid_images = valid_images_df["image"].tolist()

    clean_df = pd.DataFrame()
    for index,row in counts_df.iterrows():
        # print(row[0])
        if row[0] in valid_images: 
            clean_df = clean_df.append(row, ignore_index=True)
           # print("valid image:", row[0])
    updatedCounts = dict(clean_df.values)
    print("Number of updatedCounts:", len(updatedCounts.keys()))
    return updatedCounts

def remove_excluded_images(counts_df):
    # Removes any images that contain any of the specified strings 
    clean_df = pd.DataFrame(columns=["png","val"])
    ###############################################
    ##### HARDCODED LIST OF EXCLUSION STRINGS #####
    ###############################################
    # excluded_strings = ["desc-mosaic", "SagittalCorpusCallosum", "AxialInferiorTemporalCerebellum", "Task_bold", "w_bold"] # <<< HARDCODED LIST OF EXCLUSION STRINGS
    # excluded_strings = ["sub-LD"]
    excluded_strings = ["mcribs"]
    print("Removing images with excluded substrings:", excluded_strings)
    for index,row in counts_df.iterrows():
        if not any(string in row[0] for string in excluded_strings):
            new_row = pd.DataFrame({"png":[row[0]],"val":[row[1]]})
            clean_df = pd.concat([clean_df,new_row], ignore_index=True)
    # Below code was for a specific BCP use case
    # for index,row in counts_df.iterrows():
    #     search = re.search(r'ses-(\d+)mo', row[0])
    #     if search:
    #         ses = int(search.group(1))
    #     if ((ses > 24) and ("infantfs" in row[0])) or (ses <= 24):
    #         new_row = pd.DataFrame({"png":[row[0]],"val":[row[1]]})
    #         clean_df = pd.concat([clean_df,new_row], ignore_index=True)
    # print(clean_df)
    updatedCounts = dict(clean_df.values)
    print("Number of updatedCounts:", len(updatedCounts.keys()))
    return updatedCounts

def write_new_config(updatedCounts, config, new_config_path):
    config["sampleCounts"] = updatedCounts
    with open(new_config_path, 'w') as new_config:
        json.dump(config, new_config, indent="")

def main():
    # Enter necessary paths (config_path and new_config_path required for every function)
    config_path = ""
    new_config_path = ""
    valid_image_path = ""
    valid_subject_path = ""
    bad_subject_path = ""
    # Choose which method of image removal you want
    choice = 2 # 0 = images, 1 = good subjects, 2 = strings, # 3 = bad subjects
    print("You chose:", choice)
    config = read_in_config(config_path)
    counts = config["sampleCounts"]
    counts_df = pd.DataFrame(counts.items())
    print("Original count:", len(counts_df))

    if choice == 0:
        updateCounts = determine_valid_images(counts_df, valid_image_path)
    elif choice == 1:
        updateCounts = determine_valid_subjects(counts_df, valid_subject_path)
    elif choice == 2:
        updateCounts = remove_excluded_images(counts_df)
    elif choice == 3:
        updateCounts = remove_specific_subjects(counts_df, bad_subject_path)
    else:
        print("Invalid choice")

    write_new_config(updateCounts, config, new_config_path)

if __name__ == '__main__':
    main()

