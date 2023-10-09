var admin = require("firebase-admin");
var _ = require('lodash');
var fs = require('fs');
var serviceAccount = require("../brainswipes-firebase-adminsdk.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
var database = admin.database();

async function reconcileVotes(dataset, preview){
    const votesRef = database.ref(`datasets/${dataset}/votes`);
    const ssRef = database.ref(`datasets/${dataset}/sampleSummary`);
    const scRef = database.ref(`datasets/${dataset}/sampleCounts`);
    const ussRef = database.ref(`datasets/${dataset}/userSeenSamples`);
    const votesSnap = await votesRef.once('value');
    const votes = votesSnap.val();
    const scSnap = await scRef.once('value');
    const sampleCounts = scSnap.val();

    const reducedVotesToSampleCounts = _.reduce(votes, function(resultVSC, valueVSC, keyVSC){
        resultVSC[valueVSC.sample]? resultVSC[valueVSC.sample] += 1 : resultVSC[valueVSC.sample] = 1;
        return resultVSC;
    },{});
    
    Object.keys(sampleCounts).forEach(sample => {
        if (Object.hasOwn(reducedVotesToSampleCounts, sample)){
            sampleCounts[sample] = reducedVotesToSampleCounts[sample];
        }
    });

    if (preview) {
        fs.writeFile('votes2samplecounts.json', JSON.stringify(sampleCounts), (err) => {
            if (err) {
                console.log(err);
            }
            console.log("votes2samplecounts complete");
        });
    } else {
        try {
            scRef.set(sampleCounts);
            console.log("sampleCounts updated");
        } catch (error) {
            console.error(error);
        }
    }
    const reducedVotesToUserSeenSamples = _.reduce(votes, function(resultVUSS, valueVUSS, keyVUSS){
        resultVUSS[valueVUSS.user]? resultVUSS[valueVUSS.user][valueVUSS.sample]? resultVUSS[valueVUSS.user][valueVUSS.sample] += 1 : resultVUSS[valueVUSS.user][valueVUSS.sample] = 1 : resultVUSS[valueVUSS.user] = {[valueVUSS.sample]: 1};
        return resultVUSS;
    },{});
    if (preview) {
        fs.writeFile('votes2usersamples.json', JSON.stringify(reducedVotesToUserSeenSamples), (err) => {
            if (err) {
                console.log(err);
            }
            console.log("votes2userSamples complete");
        });
    } else {
        try {
            ussRef.set(reducedVotesToUserSeenSamples);
            console.log("userSeenSamples updated");
        } catch (error) {
            console.error(error);
        }
    }
    const reducedVotesToSampleSummary = _.reduce(votes, function(resultVSS, valueVSS, keyVSS){
        (resultVSS[valueVSS.sample] || (resultVSS[valueVSS.sample] = [])).push(valueVSS.response);
        return resultVSS;
    },{});
    const findAveVote = _.reduce(reducedVotesToSampleSummary, function(resultAV, valueAV, keyAV){
        resultAV[keyAV] = _.reduce(valueAV, function(r, v, k){
            r[0] += 1;
            r[1] = r[1] + v;
            return r;
        },[0,0])
        return resultAV;
    },{});
    const sampleSummary = _.reduce(findAveVote, function(r, v, k){
        r[k] = {count: v[0], aveVote: v[1]/v[0]}
        return r;
    },{});
    if (preview) {
        fs.writeFile('votes2samplesummary.json', JSON.stringify(sampleSummary), (err) => {
            if (err) {
                console.log(err);
            }
            console.log("votes2samplesummary complete");
        });
    } else {
        try {
            ssRef.set(sampleSummary);
            console.log("sampleSummary updated");
        } catch (error) {
            console.error(error);
        }
    }
}

function jsonDiff(firstJSONPath, secondJSONPath){
    let firstJSON = require(firstJSONPath);
    let secondJSON = require(secondJSONPath);
    const diffs = {}
    const diffs1 = Object.keys(secondJSON).filter(sample => firstJSON[sample] != secondJSON[sample]);
    const diffs2 = Object.keys(firstJSON).filter(sample => secondJSON[sample] != firstJSON[sample]);
    diffs1.forEach(sample => {
        diffs[sample] = { first: firstJSON[sample], second: secondJSON[sample]};
    });
    diffs2.forEach(sample => {
        diffs[sample] = { first: firstJSON[sample], second: secondJSON[sample]};
    });
    console.log(diffs);
}

function main(){
    const dataset = process.argv[2];
    const confirm = process.argv[3];
    let preview = true
    if (confirm == "confirm") {
        preview = false;
    }
    reconcileVotes(dataset, preview);
}

main();

// jsonDiff("./votes2samplecounts.json", "./brainswipes-default-rtdb-sampleCounts-export.json");