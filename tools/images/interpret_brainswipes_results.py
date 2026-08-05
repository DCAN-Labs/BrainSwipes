import pandas as pd
import argparse

# Author: rae McCollum
# Purpose: Take in the results BrainSwipes csv and a minimum number of swipes to consider. 
# Look at participants with the minimum numbers of swipes and determine their average T1, T2, and functional score, as well as raw number of images that passed/failed.
# Write out metrics for each subject.
# Can optionally determine passable subjects (current threshold is >0.5=pass, <0.5=fail) and write them out to a new csv
# Can optionally write out winners for studies that have multiple processing versions (used for BCP to compare mcribs vs infant fs for example)
# Last Updated: 5 Aug 2026


parser = argparse.ArgumentParser()
parser.add_argument("-f", "--csv-file", required=True, type=str, help="Brainswipes Results CSV")
parser.add_argument("-o", "--output", type=str, help="Path to output csv file. Default is same location as input csv with 'Interpreted' appended. ")
parser.add_argument("-m","--min-swipes", required=True, help="Minimum number of swipes to choose which images to include in output")
args = parser.parse_args()

result_csv = args["csv-file"]
output_path = args["output"]
min_swipes = args["min-swipes"]

def get_metrics(df):
   # print(df)
    identity = df["identity"].tolist()[0]
    parts = identity.split('_')
    sub = parts[0]
    ses = parts[1]
    if len(parts) >= 3:
        recon = parts[2]
    else:
        recon = "default"
    # Split df into three different df's for T1s, T2s, and functional registrations
    T1w = df[df["sample"].str.contains("_T1w")]
    T2w = df[df["sample"].str.contains("_T2w")]
    func = df[df["sample"].str.contains("Task")]
    # Find average votes for each df
    avgT1 = round(float(T1w["aveVote"].mean()),3)
    avgT2 = round(float(T2w["aveVote"].mean()),3)
    avgfunc = round(float(func["aveVote"].mean()),3)
    # Determine overall rating from average ratings (if any average is below 0.5, fail)
    scores = [avgT1, avgT2, avgfunc]
    rating = "pass"
    for s in scores:
        if s < 0.5:
            rating = "fail"
    # Find number of samples that passed and failed for each df
    T1_passes = len(T1w[T1w["aveVote"] > 0.5])
    T1_fails = len(T1w[T1w["aveVote"] <= 0.5])
    T2_passes = len(T2w[T2w["aveVote"] > 0.5])
    T2_fails = len(T2w[T2w["aveVote"] <= 0.5])
    func_passes = len(func[func["aveVote"] > 0.5])
    func_fails = len(func[func["aveVote"] <= 0.5])
    # Create new row to add to df
    new_row = pd.DataFrame({"subject": [sub], "session":[ses], "recon":[recon], "overall":[rating],"avgT1":[avgT1], "T1_fails":[T1_fails], "T1_passes":[T1_passes],"avgT2":[avgT2],"T2_fails":[T2_fails],"T2_passes":[T2_passes],"avgFunc":[avgfunc],"func_fails":[func_fails],"func_passes":[func_passes]})

    return new_row

def create_identity(sample):
    parts = sample.split('_')
    if parts[-1] in ["infantfs", "mcribs"]:
        indices = [0,1,-1]
        identity = '_'.join([parts[i] for i in indices])
    else:
        identity =  '_'.join(parts[0:2])
    return identity

results = pd.read_csv(result_csv)
# Only grab images with the minimum amount of swipes wanted
filt_results = results[results["count"] <= min_swipes]
filt_results["identity"] = filt_results["sample"].apply(create_identity)
identities = filt_results["identity"].unique().tolist()
#print(identities)
metrics = pd.DataFrame(columns = ["subject","session","recon","overall","avgT1","T1_fails","T1_passes","avgT2","T2_fails","T2_passes","avgFunc","func_fails","func_passes"])

for i in range(0,len(identities)):
    temp_df = filt_results[filt_results["identity"] == identities[i]]
    new_row = get_metrics(temp_df)
    metrics = pd.concat([metrics,new_row],ignore_index=True)

def determine_winners(passable):
    passable["sub_ses"] = passable["subject"] + '_' + passable["session"]
    passable["double"] = passable.duplicated(subset=["sub_ses"])
    winners = pd.DataFrame(columns = ["subject","session","recon","overall","avgT1","T1_fails","T1_passes","avgT2","T2_fails","T2_passes","avgFunc","func_fails","func_passes"])
    for idx, row in passable.iterrows():
        if row["double"] == True:
            double = row["sub_ses"]
            temp_df = passable[passable["sub_ses"] == double]
            temp_df["overall_avg"] = temp_df[["avgT1","avgT2","avgFunc"]].mean(axis=1)
            max = temp_df["overall_avg"].max()
            win = temp_df[temp_df["overall_avg"]==max]
            win.drop(columns=["sub_ses","double","overall_avg"])
            winners = pd.concat([winners,win],ignore_index=True)
    return winners

passable = metrics[metrics["overall"] == "pass"]
print("Num of passable sessions:", len(passable))
## OPTIONAL: write out just the passable sessions
# passable[["subject","session","recon"]].to_csv(different_output_path,index=False)

metrics.to_csv(output_path, index=False)
print("Output csv at ", output_path)

## OPTIONAL, write out winners for sessions with multiple identities (based on BCP study)
# winners = determine_winners(passable)
# winners[["subject","session","recon"]].to_csv(output_path,index=False)


