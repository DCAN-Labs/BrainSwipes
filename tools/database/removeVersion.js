#!/usr/bin/env node
var admin = require("firebase-admin");
const serviceAccount = require("../../brainswipes-firebase-adminsdk.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
var database = admin.database();


async function removeVersion(dataset){
    const ssRef = database.ref(`datasets/${dataset}/sampleSummary`);
    const ssSnap = await ssRef.once('value');
    const sampleSummary = ssSnap.val();

    Object.keys(sampleSummary).forEach(sample => {
        if (Object.hasOwn(sampleSummary[sample], 'lastModified')){
            delete sampleSummary[sample].lastModified;
        }
        if (Object.hasOwn(sampleSummary[sample], 'versions')){
            delete sampleSummary[sample].versions;
        }
    });
    return sampleSummary;
}

async function updateFirebase(dataset, sampleSummary, confirm){
    const ssRef = database.ref(`datasets/${dataset}/sampleSummary`);
    if (confirm){
        ssRef.update(sampleSummary, (error) => {
            if (error) {
                console.error(error);
            } else {
                console.log(`data saved: ${sample}`);
            }
        });
    } else {
        console.log(sampleSummary);
    }
    return true
}

async function main(){
    const dataset = process.argv[2];
    const confirm = process.argv[3] == 'confirm';

    const sampleSummary = await removeVersion(dataset);
    const complete = await updateFirebase(dataset, sampleSummary, confirm);

    if (complete) {
        app.delete();
    }

}

main();