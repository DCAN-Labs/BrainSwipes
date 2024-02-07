'use strict'
const S3Client = require('@aws-sdk/client-s3').S3Client;
const GetObjectCommand = require('@aws-sdk/client-s3').GetObjectCommand;
const ListObjectsV2Command = require('@aws-sdk/client-s3').ListObjectsV2Command;
const getSignedUrl = require('@aws-sdk/s3-request-presigner').getSignedUrl;
const msiKeys = require('../msiKeys.json');
const serviceAccount = require('../brainswipes-firebase-adminsdk.json');

//init the firebase connection
var admin = require("firebase-admin");
const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
const database = admin.database();

const s3Client = new S3Client({
    credentials: {
        accessKeyId: msiKeys.accessKeyId,
        secretAccessKey: msiKeys.secretAccessKey },
    endpoint: 'https://s3.msi.umn.edu',
    region: 'global',
});

async function logError(method, error) {
    try {
        const errorString = String(error)
        const ref = database.ref('log/serverErrors');
        const timestamp = Date.now();
        const server = 'dev';
        const entry = {
        timestamp,
        server,
        method,
        error: errorString
        }
        ref.push(entry);
        console.log(error);
    }
    catch(err) {
        console.log(err);
    }
}

function createUrl(filepath, bucket) {
    try{
        // choosing an image path from the firebase
        const key = filepath;
        // setting up the Get command
        const getObjectParams = {
        Bucket: bucket,
        Key: key,
        };
        const command = new GetObjectCommand(getObjectParams);
        // getting the signed URL
        const url = getSignedUrl(s3Client, command, { expiresIn: 5 });
        return url;
    }
    catch(err) {
        logError("createUrl", err);
    }
}

async function logUserManagement(method, modifierUid, modifiedUid, newRoles) {
    try {
        const ref = database.ref('log/userManagement');
        const timestamp = Date.now();
        const modifierUserRecord = await admin.auth().getUser(modifierUid);
        const modifier = modifierUserRecord.displayName;
        const modifiedUserRecord = await admin.auth().getUser(modifiedUid);
        const modified = modifiedUserRecord.displayName;
        const entry = {
        method,
        modifier,
        modified,
        newRoles,
        timestamp
        };
        ref.push(entry);
    }
    catch(err) {
        logError("logUserManagement", err);
    }
}

//find firebase user uid from displayname
async function findUser(displayName){
    try {
        let uid = '';
        await admin.auth()
        .listUsers(1000)
        .then((listUsersResult) => {
            listUsersResult.users.forEach((userRecord) => {
            if (userRecord.displayName === displayName){
                uid = userRecord.uid;
            }
            });
        })
        .catch((error) => {
            logError("findUser", error);
        });
        return uid;
    }
    catch(err) {
        logError("findUser", err);
    }
}

// list items in s3 bucket
async function listItems(input, objectsList) {
  const command = new ListObjectsV2Command(input);
  const response = await s3Client.send(command);
  const newObjectsList = objectsList.concat(response.Contents);
  if (typeof response.NextContinuationToken == "string") {
      input.ContinuationToken = response.NextContinuationToken;
      return await listItems(input, newObjectsList);
  } else {
      return newObjectsList;
  }
}

// get tsv data from s3
async function getObjectFromS3(bucket, object) {
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

// get excluded subjects
async function getExcludedSubjects(dataset) {
    const configRef = database.ref(`config/datasets/${dataset}`);
    const snap = await configRef.once('value');
    const config = snap.val();
    const bucket = config.bucket;
    const excludedSubjects = [];

    if (Object.hasOwn(config, 'exclusions')) {
        if (Object.hasOwn(config.exclusions, 'fromTSV')) {
        const data = await getObjectFromS3(bucket, config.exclusions.fromTSV.s3path);
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

async function reconcileVotes(dataset){
    const sampleCountsRef = database.ref(`datasets/${dataset}/sampleCounts`);
    const sampleSummaryRef = database.ref(`datasets/${dataset}/sampleSummary`);
    const ssSnap = await sampleSummaryRef.once('value');
    const scSnap = await sampleCountsRef.once('value');
    const sampleSummary = ssSnap.val();
    const sampleCounts = scSnap.val();

    const update = {};
    if (sampleSummary != null) {
        Object.keys(sampleCounts).forEach( (sample) => {
            if (Object.hasOwn(sampleSummary, sample)) {
                update[sample] = sampleSummary[sample].count;
            } else {
                update[sample] = 0;
            }
        });
    } else {
        Object.keys(sampleCounts).forEach( (sample) => {
        update[sample] = 0;
    });
    }
    sampleCountsRef.set(update);
}

module.exports = {
    image: function (req, res) {
        (async () => {
          try {
            const filepath = req.body.filepath;
            const bucket = req.body.bucket;
            if (bucket && filepath) {
              createUrl(filepath, bucket).then(imageUrl =>{
                res.send(imageUrl);
              });  
            }
          }
          catch(err) {
            logError("Image", err);
          }
        })()
    },
    setRoles: function (req, res) {
        (async () => {
          try {
            const obj = req.body.obj;
            const currentUser = req.body.currentUser;
            const uid = await findUser(obj.name);
            // fill in missing info in obj
            const userRecord = await admin.auth().getUser(uid);
            const userClaims = userRecord.customClaims;
            if (!Object.hasOwn(obj, 'admin')) {
              obj.admin = userClaims.admin;
            }
            if (!Object.hasOwn(obj, 'org')) {
              obj.org = userClaims.org;
            }
            if (!Object.hasOwn(obj, 'studyAdmin')) {
              obj.studyAdmin = userClaims.studyAdmin;
            }
            if (!Object.hasOwn(obj, 'datasets')) {
              obj.datasets = userClaims.datasets;
            }
            Object.keys(userClaims.datasets).forEach(dataset => {
              if (!Object.hasOwn(obj.datasets, dataset)) {
                obj.datasets[dataset] = userClaims.datasets[dataset];
              }
            });
            Object.keys(userClaims.studyAdmin).forEach(dataset => {
              if (!Object.hasOwn(obj.datasets, dataset)) {
                obj.studyAdmin[dataset] = userClaims.studyAdmin[dataset];
              }
            });
            // update claims
            admin.auth()
              .getUser(currentUser)
              .then((currentUserRecord) => {
                if (currentUserRecord.customClaims.admin) {
                  admin.auth().setCustomUserClaims(uid, { admin: obj.admin, datasets: obj.datasets, org: obj.org, studyAdmin: obj.studyAdmin }).then(() => {
                    res.send(obj);
                    logUserManagement('setRoles-full-admin', currentUser, uid, obj);
                  })
                  .catch((error) => {
                    logError("setRoles", error);
                    res.send(null);
                  });
                } else if (Object.values(currentUserRecord.customClaims.studyAdmin).includes(true)) {
                  admin.auth().getUser(uid).then((updateUserRecord) => {
                    const claims = updateUserRecord.customClaims;
                    Object.keys(currentUserRecord.customClaims.studyAdmin).forEach(study => {
                      if (currentUserRecord.customClaims.studyAdmin[study]) {
                        claims.datasets[study] = obj.datasets[study];
                        claims.studyAdmin[study] = obj.studyAdmin[study];
                        claims.org = obj.org;
                      }
                    });
                    admin.auth().setCustomUserClaims(uid, { admin: claims.admin, datasets: claims.datasets, org: claims.org, studyAdmin: claims.studyAdmin }).then(() => {
                      res.send({ ...{ name: obj.name }, ...claims });
                      logUserManagement('setRoles-study-admin', currentUser, uid, claims);
                    }).catch((error) => {
                      logError("setRoles", error);
                    })
                  })
                  .catch((error) => {
                    logError("setRoles", error);
                    res.send(null);
                  });
                }
              })
              .catch((error) => {
                logError("setRoles", error);
                res.send(null);
              });
          }
          catch(err) {
            logError("setRoles", err);
          }
        })()
    },
    setNewUserRoles: function (req, res) {
        (async () => {
          try {
            const uid = req.body.uid;
            const dbRef = database.ref('config/studies');
            const snap = await dbRef.once('value');
            const studies = snap.val();
            const datasets = {};
            const studyAdmin = {};
            Object.keys(studies).forEach(study => {
              datasets[study] = studies[study].available;
              studyAdmin[study] = false;
            });
            const defaultRoles = {
              admin: false,
              datasets,
              org: 'No Organization',
              studyAdmin
            };
            admin.auth().setCustomUserClaims(uid, defaultRoles).then(() => {
              res.send('New user roles set');
            })
            .catch((error) => {
              logError("setNewUserRoles", error);
              res.send('Error setting new user roles');
            });
          }
          catch(err) {
            logError("setNewUserRoles", err);
          }
        })()
    },
    getAllUsers: function (req, res) {
        (async () => {
          try {
            const currentUser = req.body.currentUser;
            admin.auth()
              .getUser(currentUser)
              .then((userRecord) => {
                if (userRecord.customClaims.admin || Object.values(userRecord.customClaims.studyAdmin).includes(true)) {
                  const allUsers = {};
                  admin.auth()
                    .listUsers(1000)
                    .then((listUsersResult) => {
                      listUsersResult.users.forEach((userRecord) => {
                        const userObj = {...userRecord.customClaims};
                        userObj.email = userRecord.email;
                        allUsers[userRecord.displayName] = userObj;
                      });
                      res.send(allUsers);
                    })
                    .catch((error) => {
                      logError("getAllUsers", error);
                      res.send({});
                    });
                } else {
                  res.send({});
                }
              }).catch((error) => {
                logError("getAllUsers", error);
                res.send({});
              });
          }
          catch(err) {
            logError("getAllUsers", err);
          }
        })()
    },
    addStudy: function (req, res) {
        (async () => {
          try {
            const currentUser = req.body.currentUser;
            const study = req.body.study;
            const available = req.body.available;
            admin.auth()
              .getUser(currentUser)
              .then((userRecord) => {
                if (userRecord.customClaims.admin) {
                  admin.auth()
                    .listUsers(1000)
                    .then((listUsersResult) => {
                      listUsersResult.users.forEach((userRecord) => {
                        const uid = userRecord.uid;
                        const claims = userRecord.customClaims;
                        claims.datasets[study] = available;
                        claims.studyAdmin[study] = false;
                        admin.auth().setCustomUserClaims(uid, claims);
                      });
                      res.send("Success");
                    })
                    .catch((error) => {
                      logError("addStudy", error);
                      res.send({});
                    });
                } else {
                  res.send({});
                }
              }).catch((error) => {
                logError("addStudy", error);
                res.send({});
              });
          }
          catch(err) {
            logError("addStudy", err);
          }
        })()
    },
    updateSampleCountsFromS3: function (req, res) {
        (async () => {
          try {
            const dataset = req.body.dataset;
            const configRef = database.ref(`config/datasets/${dataset}`);
            const snap = await configRef.once('value');
            const config = snap.val();
            const bucket = config.bucket;
            // get the current sample counts from the database
            const sampleCountsRef = database.ref(`datasets/${dataset}/sampleCounts`);
            const sampleCountsSnap = await sampleCountsRef.once('value');
            const sampleCounts = sampleCountsSnap.val() ? sampleCountsSnap.val() : {};
            // get the list of items in the s3 bucket
            let objectsList = [];
            if (Object.hasOwn(config, 'prefixes')) {
              for (const prefix of config.prefixes) {
                const input = {
                  Bucket: bucket,
                  Prefix: prefix,
                }
                const items = await listItems(input, []);
                objectsList = objectsList.concat(items);
              }
            } else {
              const input = {
                Bucket: bucket,
              };
              objectsList = await listItems(input, []);
            }
            let regexp = new RegExp("^([^\/]*)\.png");
            const subRegExp = new RegExp("(^sub-.*?)_");
            if (Object.hasOwn(config, 's3filepath')) {
              regexp = new RegExp(config.s3filepath.replace('/', '\/').replaceAll('{{SESSION}}', 'ses-.*?').replaceAll('{{SUBJECT}}', 'sub-\\d{6}').replaceAll('{{FILENAME}}', '([^\/]*)'));
            }
            // get exclusions
            const excludedSubjects = await getExcludedSubjects(dataset);
            let excludedSubstrings = [];
            if (Object.hasOwn(config, 'exclusions')) {
              if (Object.hasOwn(config.exclusions, 'substrings')) {
                excludedSubstrings = config.exclusions.substrings; 
              }
            }
            // update sampleCounts
            const update = {};
            objectsList.forEach(object => {
              const match = object.Key.match(regexp);
              if (match) {
                let include = true;
                const sample = match[1];
                const subMatch = sample.match(subRegExp);
                if(subMatch) {
                  const sub = subMatch[1];
                  if (excludedSubjects.includes(sub)) {
                    include = false;
                  }
                }
                if (Object.keys(sampleCounts).includes(sample)) {
                  include = false;
                }
                else {
                  excludedSubstrings.every(substring => {
                    if (sample.includes(substring)) {
                      include = false
                    }
                    return include;
                  });
                }
                if (include) {
                  update[sample] = 0;
                }
              }
            });
            sampleCountsRef.update(update);
            if (Object.keys(update).length){
              res.send(`Updated sampleCounts.\n${Object.keys(update).length} samples added.`);
            } else {
              res.send('No new PNG files found.')
            }
            reconcileVotes(dataset);
          } catch (err) {
            res.send(String(err));
            logError("updateSampleCountsFromS3", err);
          }
        })()
    }
};