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
    // add samples in sampleSummary that aren't in sampleCounts
    Object.keys(sampleSummary).forEach(sample => {
        if (Object.hasOwn(data, sample)) {
            // nothing
        } else {
            data[sample] = sampleSummary[sample];
            data[sample].active = false;
        }
    })

    // mark flagged samples
    Object.keys(flags).forEach(sample => {
        if (Object.hasOwn(data, sample)) {
            data[sample].flagged = true;
        } else {
            console.log(`Flagged sample not found ${sample}`);
        }
    })

    // user seen samples
    Object.keys(userSeenSamples).forEach(user => {
        Object.keys(userSeenSamples[user]).forEach(sample => {
            if (Object.hasOwn(data, sample)) {
                if (Object.hasOwn(data[sample], 'userSeenSamples')) {
                    data[sample].userSeenSamples[user] = userSeenSamples[user][sample];
                } else {
                    data[sample].userSeenSamples = { [user]: userSeenSamples[user][sample] };
                }
            } else {
                console.log(`userSeenSample not found ${sample}`);
            }
        })
    })

    // chats
    Object.keys(chats.chats).forEach(sample => {
        if (Object.hasOwn(data, sample)) {
            data[sample].chats = { messages: chats.chats[sample].chats, notify: chats.chats[sample].notify };
        } else {
            console.log(`Chat sample not found ${sample}`);
        }
    })

    // votes
    Object.keys(votes).forEach(vote => {
        sample = votes[vote].sample;
        delete votes[vote].sample;
        if (Object.hasOwn(data, sample)) {
            if (Object.hasOwn(data[sample], 'votes')) {
                data[sample].votes[vote] = votes[vote];
            } else {
                data[sample].votes = { [vote]: votes[vote] };
            }
        } else {
            console.log(`Votes sample not found ${sample}`);
        }
    })

    // https://gist.github.com/collingo/6700069
    if (preview) {
        const outputLocation = `consolidatedSampleData-${dataset}.json`
        require('fs').writeFile(outputLocation, JSON.stringify(data, null, 4), function(err) {
            if(err) {
              console.log(err);
            } else {
              console.log("JSON saved to "+outputLocation);
            }
        });
    }
    return true
}




async function main(){
    const dataset = process.argv[2];
    const confirm = process.argv[3];
    let preview = true
    if (confirm == "confirm") {
        preview = false;
    }
    complete = await consolidateSampleData(dataset, preview);
    if (complete) {
        app.delete();
    }
}

main();