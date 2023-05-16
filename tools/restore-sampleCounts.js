#!/usr/bin/env node
const serviceAccount = require('../brainswipes-firebase-adminsdk.json');

//init the firebase connection
var admin = require("firebase-admin");
const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
const database = admin.database();

async function reconcileVotes(dataset){
    const sampleCountsRef = database.ref(`datasets/${dataset}/sampleCounts`);
    const sampleSummaryRef = database.ref(`datasets/${dataset}/sampleSummary`);
    const ssSnap = await sampleSummaryRef.once('value');
    const scSnap = await sampleCountsRef.once('value');
    const sampleSummary = ssSnap.val();
    const sampleCounts = scSnap.val();

    const update = {};
    Object.keys(sampleCounts).forEach( (sample) => {
        if (Object.hasOwn(sampleSummary, sample)) {
            update[sample] = sampleSummary[sample].count;
        } else {
            update[sample] = 0;
        }
    });
    console.log(Object.keys(update).length);
    sampleCountsRef.set(update);
}

async function main() {
    reconcileVotes('BCPv101');
}

main();