#!/usr/bin/env node
const S3Client = require('@aws-sdk/client-s3').S3Client;
const GetObjectCommand = require('@aws-sdk/client-s3').GetObjectCommand;

var admin = require("firebase-admin");
const serviceAccount = require("../brainswipes-firebase-adminsdk.json");
const msiKeys = require('../msiKeys.json');
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
var database = admin.database();

const s3Client = new S3Client({
    credentials: {
        accessKeyId: msiKeys.accessKeyId,
        secretAccessKey: msiKeys.secretAccessKey },
    endpoint: 'https://s3.msi.umn.edu',
    region: 'global',
});

async function getLastModified(Bucket, Key) {
    try{
        const getObjectParams = {
            Bucket,
            Key,
        };
        const command = new GetObjectCommand(getObjectParams);
        result = await s3Client.send(command);
        return result.LastModified;
    } catch (err) {
        console.error('Error getting version: ', Key);
        return null;
    }
}

async function getConfig(dataset) {
    const ref = database.ref(`config/datasets/${dataset}`);
    const snap = await ref.once('value');
    const config = snap.val();
    return config;
}

async function addVersion(dataset, confirm){
    // get data from firebase
    const config = await getConfig(dataset);
    const bucket = config.bucket;

    const ssRef = database.ref(`datasets/${dataset}/sampleSummary`);
    const ssSnap = await ssRef.once('value');
    const sampleSummary = ssSnap.val();

    // const scRef = database.ref(`datasets/${dataset}/sampleCounts`);
    // const scSnap = await scRef.once('value');
    // const sampleCounts = scSnap.val();

    const subRegExp = /(sub-.*?)_/;
    const sesRegExp = /_(ses-.*?)_/;
    
    for (const sample of Object.keys(sampleSummary)) {
        const summary = sampleSummary[sample];
        let filepath = `${sample}.png`;
        if (Object.hasOwn(config, 's3filepath')) {
            const s3filepath = config.s3filepath;
            const sesMatch = sample.match(sesRegExp);
            const subMatch = sample.match(subRegExp);
            let ses = '';
            let sub = '';
            if (sesMatch) {
                ses = sample.match(sesRegExp)[1];
            }
            if (subMatch) {
                sub = sample.match(subRegExp)[1];
            }
            filepath = s3filepath.replaceAll('{{SUBJECT}}', sub).replaceAll('{{SESSION}}', ses).replaceAll('{{FILENAME}}', sample);
        }
        console.log(filepath);
        const lastModified = await getLastModified(bucket, filepath);
        if (lastModified) {
            summary.lastModified = lastModified;
        }
        console.log(summary);
    }
    return true;
}

async function main(){
    const dataset = process.argv[2];
    const confirm = process.argv[3];

    complete = await addVersion(dataset, confirm);

    if (complete) {
        app.delete();
    }
}

main();