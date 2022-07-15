//init the firebase connection
var admin = require("firebase-admin");
const { forEach, update } = require("lodash");
var _ = require('lodash');
var serviceAccount = require("./brainswipes-firebase-adminsdk-heghm-8ee318fa90.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
var database = admin.database();

async function addTrialsToStudy(study, data){
    const dbRef = database.ref(`config/studies/${study}/catchTrials`);
    const snap = await dbRef.once('value');
    const catchTrials = snap.val();
    if (snap.val()) {
        data.forEach(sample => {
            if (!Object.values(catchTrials).includes(sample)) {
                dbRef.push(sample);            
            }
        });  
    } else {
        data.forEach(sample => {
            dbRef.push(sample);            
        });
    }


}

async function addTrialsToCatch(data){
    const dbRef = database.ref('datasets/CATCH/sampleCounts');
    const snap = await dbRef.once('value');
    const sampleCounts = snap.val();
    const samples = Object.keys(sampleCounts);
    data.forEach(sample =>{
        if (!samples.includes(sample)) {
            dbRef.update({[sample]: 0});
            console.log(`Adding sample to catch trials: ${sample}`);
        } else {
            console.log(`Already a catch trial: ${sample}`);
        }
    });
}

async function prepareData(file){
    const data = require(file);
    return data;
}

// To do: check if update is finished then fire app.delete: https://stackoverflow.com/questions/41379153/firebase-wait-for-async-and-push-to-an-array

async function main(){
    const args = process.argv.slice(2);
    const file = args[0];
    const study = args[1];
    if (file && study) {
        const data = await prepareData(file);
        addTrialsToStudy(study, data);
        addTrialsToCatch(data);
    } else {
        console.log('Call this fuction with arguments: node addCatchTrials.js <FILEPATH> <STUDY>')
    }
    // app.delete();
}

main();