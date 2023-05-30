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
