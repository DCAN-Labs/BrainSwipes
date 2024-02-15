#!/usr/bin/env node

//init the firebase connection
var admin = require("firebase-admin");
const { forEach, update } = require("lodash");
var _ = require('lodash');
var jsonQuery = require('json-query');
var serviceAccount = require("../../brainswipes-firebase-adminsdk.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://brainswipes-default-rtdb.firebaseio.com"
});
var database = admin.database();

async function updateOrgs(){
    const dbRef = database.ref('uids');
    const snap = await dbRef.once('value');
    const users = snap.val();
    for (let index = 0; index < Object.keys(users).length; index++) {
        users[Object.keys(users)[index]].organization = 'No Organization';
        console.log(users[Object.keys(users)[index]]);
    }
    await dbRef.set(users);
}

async function updateCustomClaims(){
  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    listUsersResult.users.forEach((userRecord) => {
      const uid = userRecord.uid;
      let claims = userRecord.customClaims;
      // delete claims.datasets.undefined;
      // delete claims.studyAdmin.undefined;
      // claims.studyAdmin.HBCD = false
      // claims.datasets.HBCD = false
      console.log(userRecord.displayName, claims);
      // admin.auth().setCustomUserClaims(uid, claims);
    })
  } catch (error) {
    console.error(error);
  } finally {
    return true;    
  }
}

async function updateUserRecord(uid){
  admin.auth()
    .updateUser(uid, {
      emailVerified: false,
    })
    .then((userRecord) => {
      console.log(userRecord.toJSON());
    })
}

async function listAllUsers(){
  admin.auth()
    .listUsers(1000)
    .then((listUsersResult) => {
      listUsersResult.users.forEach((userRecord) => {
        console.log('user', userRecord.toJSON());
      });
    });
}

async function uidsToUsers(){
  const fromRef = database.ref('uids');
  const snap = await fromRef.once('value');
  const uids = snap.val();
  const users = {};
  Object.keys(uids).forEach(uid => {
    const username = uids[uid].username;
    const uidData = uids[uid];
    const userData = {
      consent: uidData.consent,
      level: uidData.level,
      score: uidData.score,
      taken_tutorial: uidData.taken_tutorial
    };
    users[username] = userData;
  });
  const toRef = database.ref('users');
  toRef.set(users);
}

async function setTakenTutorial() {
  const dbRef = database.ref('users');
  const snap = await dbRef.once('value');
  const users = snap.val();
  Object.keys(users).forEach(user => {
    if (users[user].taken_tutorial) {
      if (users[user].score < 100) {
        users[user].takenTutorial = 'needsPractice';
      } else {
        users[user].takenTutorial = 'complete';
      }
    } else {
      users[user].takenTutorial = 'none';
    }
  });
  console.log(users);
  dbRef.set(users);
}

async function main(){
    const finished = await updateCustomClaims();
    if (finished) {
      app.delete();
    }
}

main();