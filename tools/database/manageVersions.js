#!/usr/bin/env node
const S3Client = require('@aws-sdk/client-s3').S3Client;
const GetObjectCommand = require('@aws-sdk/client-s3').GetObjectCommand;

var admin = require("firebase-admin");
const serviceAccount = require("../../brainswipes-firebase-adminsdk.json");
const msiKeys = require('../../msiKeys.json');
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
var database = admin.database();

async function getLastModified(s3Client, Bucket, Key) {
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

async function resetSampleCount(dataset, sample, confirm) {
    if (confirm) {
        const scRef = database.ref(`datasets/${dataset}/sampleCounts/${sample}`);
        scRef.set(0, (error) => {
            if (error) {
                console.error(error);
            }
        });
    }
}

async function addVersion(dataset, confirm){
    // get data from firebase
    const config = await getConfig(dataset);
    const bucket = config.bucket;

    const ssRef = database.ref(`datasets/${dataset}/sampleSummary`);
    const ssSnap = await ssRef.once('value');
    const sampleSummary = ssSnap.val();

    const subRegExp = /(sub-.*?)_/;
    const sesRegExp = /_(ses-.*?)_/;
    
    const changed = {
        new: 0,
        modified: 0
    }
    try {
        for (const sample of Object.keys(sampleSummary)) {
            const s3Client = new S3Client({
                credentials: {
                    accessKeyId: msiKeys.accessKeyId,
                    secretAccessKey: msiKeys.secretAccessKey },
                endpoint: 'https://s3.msi.umn.edu',
                region: 'global',
            });
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
            const lastModified = await getLastModified(s3Client, bucket, filepath);
            const previousLastModified = summary.lastModified;
    
            if (lastModified) {
                if (!summary.lastModified){
                    summary.lastModified = lastModified;
                    changed.new += 1;
                } else if (JSON.stringify(lastModified).replaceAll('"', '') != previousLastModified){
                    (summary.oldVersions || (summary.oldVersions = [])).push({ lastModified: previousLastModified, aveVote: summary.aveVote, count: summary.count })
                    summary.lastModified = lastModified;
                    summary.aveVote = 0;
                    summary.count = 0;
                    changed.modified += 1;
                    resetSampleCount(dataset, sample, confirm)
                }
                if (confirm){
                    const path = `datasets/${dataset}/sampleSummary/${sample}`;
                    const ref = database.ref(path);
                    ref.update(summary, (error) => {
                        if (error) {
                            console.error(error);
                        } else {
                            // console.log(`data saved: ${sample}`);
                        }
                    });
                } else {
                    console.log(sample);
                    console.log(summary);
                }
            }
        }
    } catch (error) {
        console.error(`Error checking for versions ${dataset}\n`, error);
    }
    console.log(`Finished checking versions for ${dataset}.\nNewly tracked images: ${changed.new}, Modified images: ${changed.modified}`);
    return true;
}

async function main(){
    const dataset = process.argv[2];
    const confirm = process.argv[3] == 'confirm';

    complete = await addVersion(dataset, confirm);

    if (complete) {
        app.delete();
    }
}

main();