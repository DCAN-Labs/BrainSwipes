// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import firebase from 'firebase/app';
import 'firebase/app-check';
import 'firebase/auth';
import App from './App';
import router from './router';
// import config from './config';


Vue.config.productionTip = false;

let app;

// we have to to initialize the app w/ existing config keys here.
// this is important for when the user refreshes.

/*
"Import your Firebase configuration and set up the Firebase method onAuthStateChanged.
This will make sure Firebase initializes before loading the app when a user refreshes a page."
- https://savvyapps.com/blog/definitive-guide-building-web-app-vuejs-firebase
*/

firebase.initializeApp({
  apiKey: 'AIzaSyCnRfYP0bEqFlOxu9-76cvYv2gMbgN4lrE',
  authDomain: 'bcp-braindr.firebaseapp.com',
  databaseURL: 'https://bcp-braindr.firebaseio.com',
  projectId: 'bcp-braindr',
  storageBucket: 'bcp-braindr.appspot.com',
  messagingSenderId: '73279233790',
  appId: '1:73279233790:web:2025c2cae1f90891850faf',
  measurementId: 'G-K8PNLJ7F2J',
});
if (process.env.NODE_ENV === 'development') {
  console.log(`NODE_ENV=${process.env.NODE_ENV}`);
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
firebase.appCheck().activate('6LderB8eAAAAACq8C9buhjI7V3HeznZpTkH2wB4K', true);

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
