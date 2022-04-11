//init the firebase connection
var admin = require("firebase-admin");
var _ = require('lodash');
var serviceAccount = require("./brainswipes-firebase-adminsdk-heghm-8ee318fa90.json"); //see firebase docs to generate this file
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
var database = admin.database();

async function countSwipes(dataset){

    const dbRef = database.ref(`datasets/${dataset}/sampleCounts`);
    const snap = await dbRef.once('value');

    const samplesByVotes = _.reduce(snap.val(), function(r, v, k){
        r[v] = r[v]? r[v] + 1 : 1;
        return r;
    }, {});

    const totalSwipes = _.reduce(samplesByVotes, function(r, v, k){
        return r + v*k;
    },0)
    console.log('Total Samples: ', Object.keys(snap.val()).length);
    console.log('Total Swipes so far: ', totalSwipes);
    return samplesByVotes;
}

function calculateRemainingSwipes(swipeCounts, goal){
    const result = _.reduce(swipeCounts, function(r, v, k){
        if (parseInt(k) < goal) {
            r += (goal - k) * v;       
        }
        return r;
    },0)
    return result;
}

function calculateNeededSwipes(swipeCounts){
    const result = {};
    for (let i = 1; i < 6; i++) {
        result[i] = calculateRemainingSwipes(swipeCounts, i);
    }
    return result;
}


async function main(){
    const result = await countSwipes('BCP');
    console.log('num votes: current num samples');
    console.log(result);
    console.log('goal swipes per sample: total needed swipes');
    console.log(calculateNeededSwipes(result));
    app.delete();
}

main();