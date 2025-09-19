// This load the public firebase information that is  used client side to access the Firebase data
const clientFBKeys = require('../brainswipes-public-firebase-info.json');

const firebaseKeys = {
  apiKey: 'AIzaSyAHYmTOolAYDczaOp-I22YZQCMAXTSzlt8',
  authDomain: 'brainswipes.firebaseapp.com',
  databaseURL: clientFBKeys.databaseURL,
  projectId: 'brainswipes',
  storageBucket: 'brainswipes.appspot.com',
  messagingSenderId: '518258041913',
  appId: '1:518258041913:web:ae6cbc61a715d9941659e8',
  measurementId: 'G-YNZSDHFLC7',
};

export default firebaseKeys;
