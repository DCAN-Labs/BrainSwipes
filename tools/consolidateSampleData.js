var admin = require("firebase-admin");
var _ = require('lodash');
var serviceAccount = require("../brainswipes-firebase-adminsdk.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
var database = admin.database();

async function consolidateSampleData(dataset, preview){
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

    const catchRef = database.ref(`datasets/${dataset}/catch`);
    const catchSnap = await catchRef.once('value');
    const catchs = catchSnap.val();

    const chatsRef = database.ref(`datasets/${dataset}/chats`);
    const chatSnap = await chatsRef.once('value');
    const chats = chatSnap.val();

    const flagRef = database.ref(`datasets/${dataset}/flaggedSamples`);
    const flagSnap = await flagRef.once('value');
    const flags = flagSnap.val();

    // start by copying sampleCounts
    const data = Object.assign({}, sampleCounts);
    // copy sampleSummary for every sample in sampleCounts
    Object.keys(data).forEach(sample => {
        if (Object.hasOwn(sampleSummary, sample)) {
            data[sample] = sampleSummary[sample];
        } else {
            data[sample] = { count: 0 };
        }
    });
    //
    Object.keys(sampleSummary).forEach(sample => {
        if (Object.hasOwn(data, sample)) {
            // nothing
        } else {
            data[sample] = sampleSummary[sample];
            data[sample].active = false;
        }
    })


    console.log(data);
}




function main(){
    const dataset = process.argv[2];
    const confirm = process.argv[3];
    let preview = true
    if (confirm == "confirm") {
        preview = false;
    }
    consolidateSampleData(dataset, preview);
}

main();