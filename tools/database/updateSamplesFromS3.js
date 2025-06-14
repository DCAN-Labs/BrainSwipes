#!/usr/bin/env node

const S3Client = require('@aws-sdk/client-s3').S3Client;
const GetObjectCommand = require('@aws-sdk/client-s3').GetObjectCommand;
const ListObjectsV2Command = require('@aws-sdk/client-s3').ListObjectsV2Command;
const admin = require('firebase-admin');
const s3Config = require('../../s3-config.json');
const serviceAccount = require('../../brainswipes-firebase-adminsdk.json');

// Function entry point. Takes a dataset, updates the fire base counts. .
async function main() {
  const dataset = process.argv[2];
  const [app, database] = initFirebase();
  // Data for logging
  const now = new Date(Date.now());
  console.log(`Updating ${dataset}: ${now.toUTCString()}`);

  const finishUpdate = await updateSamplesFromS3(database, dataset);
  const finishReconcile = await reconcileVotes(database, dataset);

  if (finishUpdate && finishReconcile) {
    app.delete();
  }
}

main();

// Initialize the firebase connection
function initFirebase() {
  const firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://brainswipes-default-rtdb.firebaseio.com',
  });
  const database = admin.database();

  return [firebaseApp, database];
}

// Retrieve list of excluded subjects from Firebase config or TSV in S3.
async function getExcludedSubjects(database, dataset) {
  const configRef = database.ref(`config/datasets/${dataset}`);
  const snap = await configRef.once('value');
  const config = snap.val();
  const bucket = config.bucket;
  const excludedSubjects = [];

  if (Object.hasOwn(config, 'exclusions')) {
    if (Object.hasOwn(config.exclusions, 'fromTSV')) {
      let s3cfg = 'default';
      if (Object.hasOwn(config, 's3cfg')) {
        s3cfg = config.s3cfg;
      }
      const data = await getObjectFromS3(bucket, config.exclusions.fromTSV.s3path, s3cfg);
      const arrayData = data.split(/\r\n|\r|\n/);
      const headers = arrayData[0].split(/\t/);
      config.exclusions.fromTSV.rules.forEach(rule => {
        const filterIndex = headers.indexOf(rule.filterCol);
        const idIndex = headers.indexOf(rule.idCol);
        const pattern = rule.pattern;
        arrayData.forEach(row => {
          const rowData = row.split(/\t/);
          if (rowData.length == headers.length) {
            if (rowData[filterIndex].match(pattern)) {
              excludedSubjects.push(rowData[idIndex]);
            }
          }
        });
      });
    }
  }
  return excludedSubjects;
}

// Check S3 keys against rules, add new valid samples to Firebase sampleCounts.
function updateSampleCounts(database, objectsList, sampleCounts, regexp, subRegExp, excludedSubjects, excludedSubstrings, previousNumUpdates, dataset) {
  let numUpdates = previousNumUpdates;
  objectsList.forEach(object => {
    try {
      const match = object.Key.match(regexp);
      if (match) {
        let include = true;
        const sample = match[1];
        const subMatch = sample.match(subRegExp);
        if (subMatch) {
          const sub = subMatch[1];
          if (excludedSubjects.includes(sub)) {
            include = false;
          }
        }
        if (Object.keys(sampleCounts).includes(sample)) {
          include = false;
        } else {
          excludedSubstrings.every(substring => {
            if (sample.includes(substring)) {
              include = false;
            }
            return include;
          });
        }
        if (include) {
          database.ref(`datasets/${dataset}/sampleCounts/${sample}`).set(0);
          numUpdates += 1;
        }
      }
    } catch (error) {
      console.log(error);
    }
  });
  return numUpdates;
}

// Download an object (TSV or file) from S3 as string content.
async function getObjectFromS3(bucket, object, s3cfg) {
  const s3Client = new S3Client(s3Config[s3cfg]);
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: object,
  });
  // https://dev.to/aws-builders/using-streams-when-getting-objects-from-s3-2jo4
  const response = (await s3Client.send(command)).Body;
  const chunks = [];

  for await (const chunk of response) {
    chunks.push(chunk);
  }

  const responseBuffer = Buffer.concat(chunks);
  return responseBuffer.toString();
}

// Align sampleCounts with sampleSummary, ensuring each sample has correct vote count or 0.
async function reconcileVotes(database, dataset) {
  try {
    const sampleCountsRef = database.ref(`datasets/${dataset}/sampleCounts`);
    const sampleSummaryRef = database.ref(`datasets/${dataset}/sampleSummary`);
    const ssSnap = await sampleSummaryRef.once('value');
    const scSnap = await sampleCountsRef.once('value');
    const sampleSummary = ssSnap.val();
    const sampleCounts = scSnap.val();

    const update = {};
    if (sampleSummary != null) {
      Object.keys(sampleCounts).forEach(sample => {
        if (Object.hasOwn(sampleSummary, sample)) {
          update[sample] = sampleSummary[sample].count;
        } else {
          update[sample] = 0;
        }
      });
    } else {
      Object.keys(sampleCounts).forEach(sample => {
        update[sample] = 0;
      });
    }
    await sampleCountsRef.set(update);
  } catch (error) {
    console.log(error);
  }
  return true;
}

// List objects in S3 for a given bucket and prefix (or root) using AWS continuation tokens.
async function listItems(input, s3cfg) {
  const s3Client = new S3Client(s3Config[s3cfg]);
  const command = new ListObjectsV2Command(input);
  const response = await s3Client.send(command);
  return [response.Contents, response.NextContinuationToken];
}

// Main logic for updating samples: gets config, lists S3 files, applies exclusions, and updates sampleCounts.
async function updateSamplesFromS3(database, dataset) {
  try {
    const configRef = database.ref(`config/datasets/${dataset}`);
    const snap = await configRef.once('value');
    const config = snap.val();
    const bucket = config.bucket;

    // Get the sample counts we currently have in the database
    const sampleCountsRef = database.ref(`datasets/${dataset}/sampleCounts`);
    const sampleCountsSnap = await sampleCountsRef.once('value');
    const sampleCounts = sampleCountsSnap.val() ? sampleCountsSnap.val() : {};

    // Get the matching pattern from config in teh database/
    let regexp = new RegExp("^([^/]*)\\.png");
    const subRegExp = new RegExp("(^sub-.*?)_");
    if (Object.hasOwn(config, 's3filepath')) {
      regexp = new RegExp(config.s3filepath.replace('/', '\\/').replaceAll('{{SESSION}}', 'ses-.*?').replaceAll('{{SUBJECT}}', 'sub-\\d{6}').replaceAll('{{FILENAME}}', '([^/]*)'));
    }

    // get exclusions
    const excludedSubjects = await getExcludedSubjects(database, dataset);
    let excludedSubstrings = [];
    if (Object.hasOwn(config, 'exclusions')) {
      if (Object.hasOwn(config.exclusions, 'substrings')) {
        excludedSubstrings = config.exclusions.substrings;
      }
    }

    // get the S3 configuration
    let s3cfg = 'default';
    if (Object.hasOwn(config, 's3cfg')) {
      s3cfg = config.s3cfg;
    }

    // list and process S3 files
    let numUpdates = 0;
    if (Object.hasOwn(config, 'prefixes')) {
      for (const prefix of config.prefixes) {
        const input = { Bucket: bucket, Prefix: prefix };
        let continuate = true;
        do {
          let [items, continuationToken] = await listItems(input, s3cfg);
          if (!items) {
            continuate = false;
          } else {
            numUpdates = updateSampleCounts(database, items, sampleCounts, regexp, subRegExp, excludedSubjects, excludedSubstrings, numUpdates, dataset);
            if (typeof continuationToken === "string") {
              input.ContinuationToken = continuationToken;
            } else {
              continuate = false;
            }
          }
        } while (continuate);
      }
    } else {
      const input = { Bucket: bucket };
      let continuate = true;
      do {
        let [items, continuationToken] = await listItems(input, s3cfg);
        if (!items) {
          continuate = false;
        } else {
          numUpdates = updateSampleCounts(database, items, sampleCounts, regexp, subRegExp, excludedSubjects, excludedSubstrings, numUpdates, dataset);
          if (typeof continuationToken === 'string') {
            input.ContinuationToken = continuationToken;
          } else {
            continuate = false;
          }
        }
      } while (continuate);
    }

    // respond with number of updates
    if (numUpdates) {
      console.log(`Updated sampleCounts.\n${numUpdates} samples added.`);
    } else {
      console.log('No new PNG files found.');
    }
  } catch (error) {
    console.log(error);
  }
  return true;
}
