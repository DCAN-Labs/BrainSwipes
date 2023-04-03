<template>
  <div id="app">
    <!-- The Navbar below stays constant throughout the app.
         We've set up links on the navbar to different "routes",
         like the "Home" page and "About" page.

         There is also a right-aligned link to Login.
         When logged in, this shows the username with a dropdown menu
         to see the profile or logout.
    -->
    <div class="content">
      <nav>
        <ul class="navRoot">
          <li class="navSection main-logo">
            <router-link to="/">
              <img class="brainswipes-logo" src="../static/brainswipes-logo.svg" alt="BrainSwipes logo" />
            </router-link>
          </li>
          <li class="navSection mobile-menu">
            <SliderMenu
             :dataset="dataset"
            />
          </li>
          <li class="navSection account-details">
            <AccountMenu
              :userInfo="userInfo"
              :userData="userData"
              :loggedIn="userIsDefined"
              @logout="logout"
              :notifications="notifications"
            />
          </li>
          <li class="navSection desktop-menu"></li>
        </ul>
      </nav>
      <!-- The content is in the router view -->
      <div v-if="loading"></div>
      <div class="router" v-else>
        <router-view
          :userInfo="userInfo"
          :userData="userData"
          :allUsers="allUsers"
          :config="config"
          :db="db"
          v-on:takenTutorial="setTutorial"
          :dataset="dataset"
          :study="study"
          @changeDataset="updateDataset"
          :datasetPrivileges="datasetPrivileges"
          @changePermissions="updateDatasetPermissions"
          @login="getUserDatasets"
          :key="$route.fullPath"
          :globusToken="globusToken"
          @globusLogin="globusLogin"
          :getGlobusIdentities="getGlobusIdentities"
          :errorCodes="errorCodes"
          :definitionsAdded="definitionsAdded"
          @markDefinitionsAdded="markDefinitionsAdded"
          :notifications="notifications"
        />
      </div>
    </div>
    <div class="foot">
      <Footer 
        :config="config" 
        @changeDataset="updateDataset"
        :dataset="dataset"
        :study="study"
        :datasetPrivileges="datasetPrivileges"
      />
    </div>
  </div>
</template>

<script>
/**
 * The main entrypoint to the app.
 */
import Vue from 'vue';
import BootstrapVue from 'bootstrap-vue';


// firebase-related libraries
import VueFire from 'vuefire';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';


// useful library for objects and arrays
import _ from 'lodash';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import 'reset-css';
import '../src/css/animations.css';
import '../src/css/globals.css';
import '../src/css/typography.css';

// components
import SliderMenu from './components/Header/SliderMenu';
import AccountMenu from './components/Header/AccountMenu';
import Footer from './components/Footer';

// explicit installation required in module environments
Vue.use(VueFire);
Vue.use(BootstrapVue);

// this is only for debugging. probably should get rid of it.
window.firebase = firebase;

/**
 * This is the main entrypoint to the app.
 */
export default {
  name: 'app',
  data() {
    return {
      /**
       * This is from firebase
       */
      userInfo: {},
      /**
       * The dataset to access.
       */
      dataset: '',
      /**
       * the study the dataset falls under
       */
      study: '',
      /**
       * This is the firebase database object.
       */
      db: firebase.database(),
      /**
       * All the users in the /users document
       */
      allUsers: [],
      /**
       * Whether or not to show Mobile menu, will be extracted into Header component later
       */
      showHeader: false,
      /**
       * The user's dataset privalges
       */
      datasetPrivileges: {},
      /**
       * Globus auth token
       */
      globusToken: '',
      /**
       * Errors thrown by brainswipes
       */
      errorCodes: {
        0: 'Test Error',
        1: 'This dataset requires additional authentication. Please login with Globus.',
        2: 'The email associated with your BrainSwipes account is not associated with your Globus account. Please visit globus.org to add this identity.',
        3: 'The organization associated with your BrainSwipes email does not match the organization associated with this email in Globus. Please contact a BrainSwipes administrator',
        4: 'The email associated with your BrainSwipes account is not active in Globus.',
        5: 'The email associated with your BrainSwipes account has not been verified. Please verify in your profile.',
      },
      /**
       * prevents the tutorial addDefinitions function from running more than once
       */
      definitionsAdded: false,
      /**
       * the config from firebase
       */
      config: {},
      loading: true,
      /**
       * if the user has notifications
       */
      notifications: {},
    };
  },
  /**
   * When the component is mounted, if there is a query in the route, then
   * load the config file from the query and set it to the components config variable.
   */
  mounted() {
    this.userInfo = firebase.auth().currentUser;
    const self = this;
    firebase.auth().onAuthStateChanged((user) => {
      self.userInfo = user || {};
    });
  },
  components: {
    Footer,
    SliderMenu,
    AccountMenu,
  },

  firebase() {
    return {
      allUsers: {
        source: this.db.ref('/users/').orderByChild('score'),
        asObject: true,
      },
    };
  },
  computed: {
    /**
     * the current user's data, based on the userInfo from the firebase.auth.
     * this matches the info in allUsers (/users) to the firebase.auth user info.
     */
    userData() {
      let data = {};
      if (this.userInfo == null) {
        return data;
      } else if (!Object.keys(this.userInfo).length) {
        return data;
      }

      _.map(this.allUsers, (value, key) => {
        if (key === this.userInfo.displayName) {
          data = value;
          data['.key'] = key;
          data.username = key;
        }
      });
      return data;
    },
    /**
     * whether or not a user is authenticated and has a username.
     */
    userIsDefined() {
      if (this.userInfo == null) {
        return false;
      }
      return !!Object.keys(this.userInfo).length;
    },
  },
  methods: {
    /**
     * log out of firebase
     */
    logout() {
      this.globusToken = '';
      firebase
        .auth()
        .signOut()
        .then(() => {
          this.userInfo = {};
          this.datasetPrivileges = {};
          this.$router.replace('login');
        });
    },
    /**
     * set the userInfo attribute
     */
    setUser(user) {
      this.userInfo = user || {};
    },
    /**
     * set the tutorial status of the current user
     */
    setTutorial(val) {
      const currentValue = this.userData.takenTutorial;
      let level = val;
      let route = 'Home';
      switch (true) {
        case (currentValue === 'complete' && val === 'complete'):
          route = 'Home';
          level = 'complete';
          break;
        case (currentValue === 'complete' && val === 'needsPractice'):
          route = 'Practice';
          level = 'complete';
          break;
        case (currentValue === 'needsPractice' && val === 'complete'):
          route = 'Home';
          level = 'complete';
          break;
        case (currentValue === 'needsPractice' && val === 'needsPractice'):
          route = 'Practice';
          level = 'needsPractice';
          break;
        case (currentValue === 'none' && val === 'needsPractice'):
          route = 'Practice';
          level = 'needsPractice';
          break;
        default:
          route = 'Home';
          level = 'none';
      }
      this.db
        .ref(`/users/${this.userInfo.displayName}`)
        .child('takenTutorial')
        .set(level);
      this.$router.push({ name: route });
    },
    /**
     * Passed to child to update dataset on event
     */
    updateDataset(newDataset, newStudy) {
      this.dataset = newDataset;
      this.study = newStudy;
    },
    /**
     * What datasets the user can access
     */
    async getUserDatasets() {
      if (firebase.auth().currentUser) {
        firebase.auth().currentUser.getIdTokenResult(true).then((idTokenResult) => {
          this.datasetPrivileges = idTokenResult.claims.datasets;
          this.getNotifications();
        });
      }
    },
    updateDatasetPermissions() {
      this.getUserDatasets();
    },
    globusLogin(token) {
      this.globusToken = token;
    },
    async getGlobusIdentities(token) {
      let identities = {};
      if (token) {
        const response = await fetch('https://auth.globus.org/p/whoami?include=identity_provider', {
          headers: new Headers({
            Authorization: `Bearer ${token}`,
          }),
        });
        const responseJSON = await response.json();
        /* eslint-disable */
        identities = _.reduce(responseJSON.identities, function (r, v) {
          r[v.email] = [v.organization, v.status];
          return r;
        }, {});
        /* eslint-enable */
      }
      return identities;
    },
    markDefinitionsAdded() {
      this.definitionsAdded = true;
    },
    async getConfig() {
      this.db.ref('config').on('value', (snap) => {
        const config = snap.val();
        this.config = config;
        this.loading = false;
      });
    },
    getNotifications() {
      Object.keys(_.pickBy(this.datasetPrivileges, _.identity)).forEach((study) => {
        this.db.ref(`datasets/${study}/chats/chats`).on('value', (snap) => {
          const chats = snap.val();
          const studyNotification = _.reduce(chats, (result, value) => {
            // eslint-disable-next-line
            result = value.notify[firebase.auth().currentUser.displayName] || result;
            return result;
          }, false);
          Vue.set(this.notifications, study, studyNotification);
        });
      });
    },
  },
  /**
   * intialize the animate on scroll library (for tutorial) and listen to authentication state
   */
  async created() {
    await this.getUserDatasets();
    await this.getConfig();
  },
};
</script>

<style>
/*
    You can style your component here. Since this is a top level component
    the styles follow into child components.
  */
@import url('https://fonts.googleapis.com/css?family=Nunito:400,600,700&display=swap');

.content {
  flex: 1 0 auto;
  min-height: -webkit-fill-available;
  height: 90vh;
}

.router {
  height: 80vh;
}

.brainswipes-logo {
  height: auto;
  width: 100%;
}

#app {
  font-family: Nunito, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}

#signupForm {
  max-width: 400px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0px 0 7px 0px #80808036;
}

/* Main Navigation: navRoot */

.navRoot {
  display: flex;
  justify-content: space-between;
  position: relative;
  padding: 1em 1.25em;
  height: 100px;
  z-index: 2;
}

.navRoot .navSection.main-logo {
  position: absolute;
  width: 7.5em;
  height: 3em;
  left: 50%;
  right: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.navRoot .navSection.desktop-menu {
  display: none;
}

@media (min-width: 65em) {
  .navRoot {
    margin: 0 auto;
    width: 65em;
    padding: 2em 0;
  }
  .navRoot .navSection.main-logo {
    position: static;
    transform: none;
  }
}

@media (max-width: 1040px){
  .foot{
    display: none;
  }
}

/* width */
::-webkit-scrollbar {
  width: 10px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #f1f1f1;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #888;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.information{
  display: block;
  content: ' ';
  background-image: url('../src/assets/info-circle.svg');
  background-repeat: no-repeat;
  background-size: 16px 16px;
  height: 16px;
  width: 16px;
  cursor: help;
  margin-left: 2px;
}

.information-wrapper{
  margin-top: 5px;
  display: flex;
  justify-content: center;
}

.inner-information-wrapper{
  display: flex;
}

.seperator {
  max-width: 500px;
}

.btn-swipes, .btn-swipes:hover,
  .btn-swipes:focus, .btn-swipes:active {
  color: #fff !important;
  background-color: maroon !important;
  border-color: maroon !important;
  margin: 0.1em;
}

.btn-unavailable {
  color: #fff !important;
  background-color: grey !important;
  border-color: grey !important;
  margin: 0.1em;
}

.globus-auth-error {
  background-color: #F8D7DA;
  padding: 5px;
  margin: 5px;
}

h3 {
  font-size: 1.1em;
  font-weight: bold;
  color: rgb(100,0,0);
}

h2 {
  font-size: 1.3em;
  color: rgb(100,0,0);
  font-weight: bold;
  margin: 0.5em;
}

</style>
