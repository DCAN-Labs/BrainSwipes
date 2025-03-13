'use strict'
const S3Client = require('@aws-sdk/client-s3').S3Client;
const GetObjectCommand = require('@aws-sdk/client-s3').GetObjectCommand;
const getSignedUrl = require('@aws-sdk/s3-request-presigner').getSignedUrl;
const s3Config = require('../s3-config.json');
const serviceAccount = require('../brainswipes-firebase-adminsdk.json');

//init the firebase connection
var admin = require("firebase-admin");
const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
const database = admin.database();

// Error Logging function
async function logError(method, error) {
    try {
        const errorString = String(error)
        const ref = database.ref('log/serverErrors');
        const timestamp = Date.now();
        const server = process.env.NODE_ENV;
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

// Generates an oject for the 'dataset' key in customClaims.
async function generateDatasetAccess() {
  // Reference for the Firebase database.
  const db = admin.database();
  // Reference for the 'config' node in the database.
  const configRef = db.ref('config');

  try {
    // Fetch the 'config' node from Firebase.
    const snapshot = await configRef.once('value');
    // Get the actual data from the snapshot.
    const configData = snapshot.val();

    // Initialize an empty object to store dataset access information.
    let defaultAccess = {};
    // Check if "configData" exists and contains a "studies" key.
    if (configData && configData.studies) {
      // Iterate though each study.
      Object.keys(configData.studies).forEach(study => {
        const studyData = configData.studies[study];
        // If the "available"' field exists, store its value; otherwise, store a default of false
        //   ** If we can't find information on a study it probably has not
        //   been configured and we'll default to no access
        defaultAccess[study] = (studyData && studyData.available !== undefined) ? studyData.available : false;
      });
    }
    // Return the generated dataset access object
    return defaultAccess;
  // Log any errors to the console
  } catch (error) {
    console.error('Error fetching config data:', error);
    throw new Error(`Error fetching config data: ${error.message}`);
  }
}

async function createUrl(filepath, bucket, s3Credentials) {
    try{
        const s3Client = new S3Client(s3Credentials);
        // setting up the Get command
        const getObjectParams = {
          Bucket: bucket,
          Key: filepath,
        };
        const command = new GetObjectCommand(getObjectParams);
        // getting the signed URL
        const url = await getSignedUrl(s3Client, command, { expiresIn: 10 });
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

module.exports = {
    image: function (req, res) {
        (async () => {
          try {
            const filepath = req.body.filepath;
            const bucket = req.body.bucket;
            const s3cfg = req.body.s3cfg;
            const s3Credentials = s3cfg ? s3Config[s3cfg] : s3Config.default;
            if (bucket && filepath) {
              createUrl(filepath, bucket, s3Credentials).then(data =>{
                res.send(data);
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
          // Initialize object for studyAdmin
          const studyAdmin = {};
          // Call the async function to generate dataset access
          const datasets = await generateDatasetAccess();
          const defaultRoles = {
            admin: false,
            datasets,
            org: 'No Organization',
            studyAdmin,
          };
          admin.auth().setCustomUserClaims(uid, defaultRoles).then(() => {
            res.send('New user roles set');
          })
          .catch((error) => {
            logError('setNewUserRoles', error);
            res.send('Error setting new user roles');
          });
        }
        catch (err) {
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
          catch (err) {
            logError('getAllUsers', err);
          }
        })();
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
    }
};