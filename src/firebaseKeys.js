// This load the public firebase information that is used client side to access the Firebase data
const clientFBKeys = require('../brainswipes-public-firebase-info.json');

const firebaseKeys = {
  apiKey: clientFBKeys.apiKey,
  authDomain: clientFBKeys.authDomain,
  databaseURL: clientFBKeys.databaseURL,
  projectId: clientFBKeys.projectId,
  storageBucket: clientFBKeys.storageBucket,
  messagingSenderId: clientFBKeys.messagingSenderId,
  appId: clientFBKeys.appId,
  measurementId: clientFBKeys.measurementId,
};

export default firebaseKeys;
