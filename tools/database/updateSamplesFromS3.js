#!/usr/bin/env node

const S3Client = require('@aws-sdk/client-s3').S3Client;
const GetObjectCommand = require('@aws-sdk/client-s3').GetObjectCommand;
const ListObjectsV2Command = require('@aws-sdk/client-s3').ListObjectsV2Command;
const admin = require('firebase-admin');
const s3Config = require('../../s3-config.json');
const serviceAccount = require('../../brainswipes-firebase-adminsdk.json');

async function main() {
  // Input argument of dataset name in Firebase
  const dataset = process.argv[2];
  const [app, database] = initFirebase();

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
    databaseURL: 'https://brainswipes-default-rtdb.firebaseio.com'
  });
  const database = admin.database();

  return [firebaseApp, database];
}
// Get excluded subjects for "from TSV" exclusion option
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
      // Use regex matching to exclude anything that matches a pattern in TSV
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

function updateSampleCounts(database, objectsList, sampleCounts, regexp, subRegExp, excludedSubjects, excludedSubstrings, previousNumUpdates, dataset) {
  let numUpdates = previousNumUpdates;
  // Loop through s3 objects (objectsList) to determine if they should be added to sampleCounts
  objectsList.forEach(object => {
    try {
      const match = object.Key.match(regexp);
      if (match) {
        let include = true;
        const sample = match[1];
        const subMatch = sample.match(subRegExp);
        if (subMatch) {
          const sub = subMatch[1];
          // Don't include excluded subjects
          if (excludedSubjects.includes(sub)) {
            include = false;
          }
        }
        // Don't add image if it already exists in sampleCounts
        if (Object.keys(sampleCounts).includes(sample)) {
          include = false;
        } else {
          // Don't include images w/ excluded substrings
          excludedSubstrings.every(substring => {
            if (sample.includes(substring)) {
              include = false;
            }
            return include;
          });
        }
        // Add image to sampleCounts with 0 counts
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

// Get tsv data from s3
async function getObjectFromS3(bucket, object, s3cfg) {
  const s3Client = new S3Client(s3Config[s3cfg]);
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: object
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

async function reconcileVotes(database, dataset) {
  try {
    const sampleCountsRef = database.ref(`datasets/${dataset}/sampleCounts`);
    const sampleSummaryRef = database.ref(`datasets/${dataset}/sampleSummary`);
    const ssSnap = await sampleSummaryRef.once('value');
    const scSnap = await sampleCountsRef.once('value');
    const sampleSummary = ssSnap.val();
    const sampleCounts = scSnap.val();

    const update = {};
    // If sampleSummary already exists for the image, add that info to the new sampleCounts entry
    if (sampleSummary != null) {
      Object.keys(sampleCounts).forEach(sample => {
        if (Object.hasOwn(sampleSummary, sample)) {
          update[sample] = sampleSummary[sample].count;
        } else {
          update[sample] = 0;
        }
      });
    // initialize count to 0 IF there was no data
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
// List items in s3 bucket
async function listItems(input, s3cfg) {
  const s3Client = new S3Client(s3Config[s3cfg]);
  const command = new ListObjectsV2Command(input);
  const response = await s3Client.send(command);
  return [response.Contents, response.NextContinuationToken];
}

async function updateSamplesFromS3(database, dataset) {
  try {
    const configRef = database.ref(`config/datasets/${dataset}`);
    const snap = await configRef.once('value');
    const config = snap.val();
    const bucket = config.bucket;
    // Get the current sample counts from the database
    const sampleCountsRef = database.ref(`datasets/${dataset}/sampleCounts`);
    const sampleCountsSnap = await sampleCountsRef.once('value');
    const sampleCounts = sampleCountsSnap.val() ? sampleCountsSnap.val() : {};
    // Get matching pattern from config

    let regexp = new RegExp("^([^/]*)\\.png");
    const subRegExp = new RegExp("(^sub-.*?)_");
    if (Object.hasOwn(config, 's3filepath')) {
      regexp = new RegExp(config.s3filepath.replaceAll('{{SESSION}}', 'ses-.*?').replaceAll('{{SUBJECT}}', 'sub-[^/]*').replaceAll('{{FILENAME}}', '(sub-[^/]*)'));
    }
    // get exclusions
    const excludedSubjects = await getExcludedSubjects(database, dataset);
    let excludedSubstrings = [];
    if (Object.hasOwn(config, 'exclusions')) {
      if (Object.hasOwn(config.exclusions, 'substrings')) {
        excludedSubstrings = config.exclusions.substrings;
      }
    }
    // Get S3 Configuration
    let s3cfg = 'default';
    if (Object.hasOwn(config, 's3cfg')) {
      s3cfg = config.s3cfg;
    }
    // get the list of items in the s3 bucket
    // I think some of this code can be collapsed, the only difference is the input?
    let numUpdates = 0;
    if (Object.hasOwn(config, 'prefixes')) {
      for (const prefix of config.prefixes) {
        const input = { Bucket: bucket, Prefix: prefix };
        let continuate = true;
        do {
          let [items, continuationToken] = await listItems(input, s3cfg);
          if (items == undefined) {
            continuate = false;
          } else {
            numUpdates = updateSampleCounts(database, items, sampleCounts, regexp, subRegExp, excludedSubjects, excludedSubstrings, numUpdates, dataset);
            if (typeof continuationToken == "string") {
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
        if (items == undefined) {
          continuate = false;
        } else {
          numUpdates = updateSampleCounts(database, items, sampleCounts, regexp, subRegExp, excludedSubjects, excludedSubstrings, numUpdates, dataset);
          if (typeof continuationToken == "string") {
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
