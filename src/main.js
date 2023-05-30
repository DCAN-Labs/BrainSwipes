// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import firebase from 'firebase/app';
import 'firebase/app-check';
import 'firebase/auth';
import App from './App';
import router from './router';
import firebaseKeys from './firebaseKeys';


Vue.config.productionTip = false;

let app;

// we have to to initialize the app w/ existing config keys here.
// this is important for when the user refreshes.

/*
"Import your Firebase configuration and set up the Firebase method onAuthStateChanged.
This will make sure Firebase initializes before loading the app when a user refreshes a page."
- https://savvyapps.com/blog/definitive-guide-building-web-app-vuejs-firebase
*/

firebase.initializeApp(firebaseKeys);
// if (process.env.NODE_ENV === 'development') {
//   console.log(`NODE_ENV=${process.env.NODE_ENV}`);
//   self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
// }
firebase.appCheck().activate('6LderB8eAAAAACq8C9buhjI7V3HeznZpTkH2wB4K', true);


// https://firebase.google.com/docs/auth/web/auth-state-persistence#modifying_the_auth_state_persistence
/* eslint-disable */
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
  .then(() => {
    // Existing and future Auth states are now persisted in the current
    // session only. Closing the window would clear any existing state even
    // if a user forgets to sign out.
    // ...
    // New sign-in will be persisted with session persistence.
    return firebase.auth().signInWithEmailAndPassword(email, password);
  })
  .catch((error) => {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
  });
/* eslint-enable */

firebase.auth().onAuthStateChanged(() => {
  if (!app) {
    /* eslint-disable no-new */
    app = new Vue({
      el: '#app',
      template: '<App/>',
      components: { App },
      router,
    });
  }
});
