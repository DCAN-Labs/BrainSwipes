#!/usr/bin/env node
var admin = require("firebase-admin");
var _ = require('lodash');
var serviceAccount = require("../../brainswipes-firebase-adminsdk.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
var database = admin.database();

async function getVotes(dataset, confirm) {
    const votesRef = database.ref(`datasets/${dataset}/votes`);
    const votesSnap = await votesRef.once('value');
    const votes = votesSnap.val();
    const userScores = _.reduce(votes, function (result, value){
        const user = value.user;
        result[user] = Object.hasOwn(result, user) ? result[user] + 1 : 0;
        return result;
    }, {});


    if (confirm) {
        for (user of Object.keys(userScores)) {
            await database.ref(`users/${user}/datasets/${dataset}/score`).set(userScores[user]);
        }
    } else {
        console.log(userScores);
    }
    return true;
}

async function getCatchTrials(dataset, confirm) {
    const catchRef = database.ref(`datasets/${dataset}/catch`);
    const catchSnap = await catchRef.once('value');
    const catchs = catchSnap.val();

    if(catchs){
        const votes = catchs.votes;
        const samples = catchs.sampleCounts;
    
        const userScores = _.reduce(votes, function (result, value){
            const user = value.user;
            const answer = samples[value.sample];
            if(answer) {
                const correct = (value.response === 1 && answer === 'pass') || (value.response === 0 && answer === 'fail') ? 1 : 0;
                (result[user] || (result[user] = [])).push(correct);
                if (result[user].length > 5) {
                    result[user].shift();
                }
            } 
            return result;
        },{});

        if (confirm) {
            for (user of Object.keys(userScores)) {
                await database.ref(`users/${user}/datasets/${dataset}/catch`).set(userScores[user]);
            }
        } else {
            console.log(userScores);
        }
    }
    return true;
}

async function main(){
    const dataset = process.argv[2];
    const confirm = process.argv[3] === 'confirm';

    const finishVotes = await getVotes(dataset, confirm);
    const finishCatch = await getCatchTrials(dataset, confirm);

    if (finishVotes && finishCatch) {
        app.delete();
    }
}

main();