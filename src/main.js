// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import firebase from 'firebase/app';
import 'firebase/app-check';
import 'firebase/auth';
import App from './App';
import router from './router';
// import firebaseKeys from './firebaseKeys';

// Instead of importing the object at build time
// we import an async function that fetches the config at runtime.
import getFirebaseConfig from './firebaseKeys';

Vue.config.productionTip = false;

let app;

// we have to to initialize the app w/ existing config keys here.
// this is important for when the user refreshes.

/*
"Import your Firebase configuration and set up the Firebase method onAuthStateChanged.
This will make sure Firebase initializes before loading the app when a user refreshes a page."
- https://savvyapps.com/blog/definitive-guide-building-web-app-vuejs-firebase
*/

// Wrap initialization of FIrebase variables in async bootstrap function so we can
// fetch runtime-config.json BEFORE calling firebase.initializeApp(...).
async function bootstrap() {
  // Runtime-loaded config avoids including firebase keys.
  // The server provides them via runtime-config.json.
  const firebaseConfig = await getFirebaseConfig();

  console.log('Firebase runtime config:', {
    projectId: firebaseConfig.projectId,
    apiKeyTail: (firebaseConfig.apiKey || '').slice(-10),
  });

  // Initialize Firebase before we create the Vue app.
  firebase.initializeApp(firebaseConfig);

  // Keep existing "initialize Firebase before loading app on refresh".
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
}

// Call bootstrap() and fail if config is missing/misconfigured.
// We could also render an error screen here for a friendlier UI.
bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
});
