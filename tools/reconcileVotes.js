var admin = require("firebase-admin");
var _ = require('lodash');
var serviceAccount = require("../brainswipes-firebase-adminsdk.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
var database = admin.database();

async function reconcileVotes(dataset, preview){
    // get data from firebase
    const votesRef = database.ref(`datasets/${dataset}/votes`);
    const votesSnap = await votesRef.once('value');
    const votes = votesSnap.val();

    const ssRef = database.ref(`datasets/${dataset}/sampleSummary`);
    const ssSnap = await ssRef.once('value');
    const sampleSummary = ssSnap.val();

    const scRef = database.ref(`datasets/${dataset}/sampleCounts`);
    const scSnap = await scRef.once('value');
    const sampleCounts = scSnap.val();

    const ussRef = database.ref(`datasets/${dataset}/userSeenSamples`);
    const ussSnap = await ussRef.once('value');
    const userSeenSamples = ussSnap.val();

    // update sampleCounts from votes
    const reducedVotesToSampleCounts = _.reduce(votes, function(resultVSC, valueVSC, keyVSC){
        resultVSC[valueVSC.sample]? resultVSC[valueVSC.sample] += 1 : resultVSC[valueVSC.sample] = 1;
        return resultVSC;
    },{});
    
    const sampleCountsUpdate = Object.assign({}, sampleCounts);

    Object.keys(sampleCounts).forEach(sample => {
        if (Object.hasOwn(reducedVotesToSampleCounts, sample)){
            sampleCountsUpdate[sample] = reducedVotesToSampleCounts[sample];
        }
    });

    console.log("sampleCounts diff:");
    sampleCountsDiff(sampleCounts, sampleCountsUpdate);

    if (!preview) {
        try {
            scRef.set(sampleCountsUpdate);
            console.log("sampleCounts updated");
        } catch (error) {
            console.error(error);
        }
    }

    // update userSeenSamples from votes
    const reducedVotesToUserSeenSamples = _.reduce(votes, function(resultVUSS, valueVUSS, keyVUSS){
        resultVUSS[valueVUSS.user]? resultVUSS[valueVUSS.user][valueVUSS.sample]? resultVUSS[valueVUSS.user][valueVUSS.sample] += 1 : resultVUSS[valueVUSS.user][valueVUSS.sample] = 1 : resultVUSS[valueVUSS.user] = {[valueVUSS.sample]: 1};
        return resultVUSS;
    },{});

    console.log("userSeenSamples diff:");
    userSeenSamplesDiff(userSeenSamples, reducedVotesToUserSeenSamples);

    if (!preview) {
        try {
            ussRef.set(reducedVotesToUserSeenSamples);
            console.log("userSeenSamples updated");
        } catch (error) {
            console.error(error);
        }
    }

    // update sampleSummary from votes
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
    const updateSampleSummary = _.reduce(findAveVote, function(r, v, k){
        r[k] = { aveVote: v[1]/v[0], count: v[0] }
        return r;
    },{});

    console.log("sampleSummary diff:");
    sampleSummaryDiff(sampleSummary, updateSampleSummary);

    if (!preview) {
        try {
            ssRef.set(updateSampleSummary);
            console.log("sampleSummary updated");
        } catch (error) {
            console.error(error);
        }
    }
}

function sampleCountsDiff(firstJSON, secondJSON){
    const diffs = {};
    const diffs1 = Object.keys(secondJSON).filter(sample => firstJSON[sample] != secondJSON[sample]);
    const diffs2 = Object.keys(firstJSON).filter(sample => secondJSON[sample] != firstJSON[sample]);
    diffs1.forEach(sample => {
        diffs[sample] = { db: firstJSON[sample], update: secondJSON[sample]};
    });
    diffs2.forEach(sample => {
        diffs[sample] = { db: firstJSON[sample], update: secondJSON[sample]};
    });
    console.log(diffs);
}

function sampleSummaryDiff(firstJSON, secondJSON) {
    const diffs = {};
    const aveVoteDiffs1 = Object.keys(secondJSON).filter(sample => firstJSON[sample]['aveVote'] != secondJSON[sample]['aveVote']);
    const aveVoteDiffs2 = Object.keys(firstJSON).filter(sample => secondJSON[sample]['aveVote'] != firstJSON[sample]['aveVote']);
    const countDiffs1 = Object.keys(secondJSON).filter(sample => firstJSON[sample]['count'] != secondJSON[sample]['count']);
    const countDiffs2 = Object.keys(firstJSON).filter(sample => secondJSON[sample]['count'] != firstJSON[sample]['count']);
    aveVoteDiffs1.forEach(sample => {
        diffs[sample] = { db: firstJSON[sample], update: secondJSON[sample] };
    });
    aveVoteDiffs2.forEach(sample => {
        diffs[sample] = { db: firstJSON[sample], update: secondJSON[sample] };
    });
    countDiffs1.forEach(sample => {
        diffs[sample] = { db: firstJSON[sample], update: secondJSON[sample] };
    });
    countDiffs2.forEach(sample => {
        diffs[sample] = { db: firstJSON[sample], update: secondJSON[sample] };
    });
    console.log(diffs);
}

function userSeenSamplesDiff(firstJSON, secondJSON) {
    const diffs = {};
    const diffs1 = {};
    Object.keys(firstJSON).forEach(user => {
        diffs1[user] = Object.keys(secondJSON[user]).filter(sample => firstJSON[user][sample] != secondJSON[user][sample]);
    });
    const diffs2 = {};
    Object.keys(secondJSON).forEach(user => {
        diffs2[user] = Object.keys(firstJSON[user]).filter(sample => secondJSON[user][sample] != firstJSON[user][sample]);
    });
    Object.keys(diffs1).forEach(user => {
        if (Object.keys(diffs1[user]).length) {
            diffs[user] = {};
            diffs1[user].forEach(sample => {
                diffs[user][sample] = { db: firstJSON[user][sample], update: secondJSON[user][sample] };
            });
        }
    });
    Object.keys(diffs2).forEach(user => {
        if (Object.keys(diffs2[user]).length) {
            diffs[user] = diffs[user] ? diffs[user]: {};
            diffs2[user].forEach(sample => {
                diffs[user][sample] = { db: firstJSON[user][sample], update: secondJSON[user][sample] };
            });
        }
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
