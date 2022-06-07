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
              <img src="./assets/swipes-for-science-logo.svg" alt="BrainSwipes logo" />
            </router-link>
          </li>
          <li class="navSection mobile-menu">
            <SliderMenu
             :dataset="dataset"
            />
          </li>
          <li class="navSection account-details">
            <AccountMenu :userInfo="userInfo" :userData="userData" :loggedIn="userIsDefined" @logout="logout" />
          </li>
          <li class="navSection desktop-menu"></li>
        </ul>
      </nav>
      
      <!-- The content is in the router view -->
      <div class="router">
        <router-view
          :userInfo="userInfo"
          :userData="userData"
          :allUsers="allUsers"
          :levels="levels"
          :currentLevel="currentLevel"
          :config="config"
          :db="db"
          v-on:taken_tutorial="setTutorial"
          :dataset="dataset"
          @changeDataset="updateDataset"
          :datasetPrivileges="datasetPrivileges"
          @changePermissions="updateDatasetPermissions"
          :studies="studies"
          :bucket="bucket"
          @login="activateDatasets"
          :key="$route.fullPath"
          :globusToken="globusToken"
          @globusLogin="globusLogin"
          :getGlobusIdentities="getGlobusIdentities"
          :globusAllowedOrgs="globusAllowedOrgs"
          :errorCodes="errorCodes"
          :maintenanceDate="maintenanceDate"
          :maintenanceStatus="maintenanceStatus"
        />
      </div>
    </div>
    <div class="foot">
      <Footer 
        :config="config" 
        @changeDataset="updateDataset"
        :dataset="dataset"
        :studies="studies"
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

// Animate on scroll, for the tutorial
import AOS from 'aos';
import 'aos/dist/aos.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
// font-awesome icons
import '../node_modules/font-awesome/css/font-awesome.min.css';
import '../node_modules/reset-css/reset.css';
import '../src/css/animations.css';
import '../src/css/globals.css';
import '../src/css/typography.css';


// config options
import config from './config';

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
       * This is the firebase database object.
       */
      db: firebase.database(),
      /**
       * This is the config object, it defines the look of the app
       */
      config,
      /**
       * Whether or not to show the configuration panel
       */
      showConfig: false,
      /**
       * All the users in the /uids document
       */
      allUsers: [],
      /**
       * The configuration state, keeping track of the step number only.
       */
      configurationState: {
        step: 0,
      },
      /**
       * Whether or not to show Mobile menu, will be extracted into Header component later
       */
      showHeader: false,
      /**
       * The user's dataset privalges
       */
      datasetPrivileges: {},
      /**
       * List of studies available
       */
      studies: {},
      /**
       * s3 bucket where the images are stored
       */
      bucket: '',
      /**
       * Globus auth token
       */
      globusToken: '',
      /**
       * List of organizations we trust from globus auth
       */
      globusAllowedOrgs: [],
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
       * maintenance banner config from db
       */
      maintenanceDate: '',
      maintenanceStatus: false,
    };
  },
  /**
   * When the component is mounted, if there is a query in the route, then
   * load the config file from the query and set it to the components config variable.
   */
  mounted() {
    AOS.init();
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
        source: this.db.ref('/uids/').orderByChild('score'),
        asObject: true,
      },
    };
  },
  computed: {
    /**
     * the firebase keys from the config file
     */
    firebaseKeys() {
      return this.config.firebaseKeys;
    },
    /**
     * the current user's data, based on the userInfo from the firebase.auth.
     * this matches the info in allUsers (/uids) to the firebase.auth user info.
     */
    userData() {
      let data = {};
      if (this.userInfo == null) {
        return data;
      } else if (!Object.keys(this.userInfo).length) {
        return data;
      }

      _.map(this.allUsers, (value, key) => {
        if (value.username === this.userInfo.displayName) {
          data = value;
          data['.key'] = key;
        }
      });
      return data;
    },
    /**
     * The levels are defined based on score bins. Each level also defines
     * a character image that a user can "unlock" when the annotate enough samples.
     * eventually, this should be abstracted out into the config variable.
     */
    levels() {
      return this.config.levels;
    },
    /**
     * the current user's level.
     */
    currentLevel() {
      let clev = {};
      _.mapValues(this.levels, (val) => {
        if (this.userData.score >= val.min && this.userData.score <= val.max) {
          clev = val;
        }
      });

      return clev;
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
      this.db
        .ref(`/uids/${this.userInfo.uid}`)
        .child('taken_tutorial')
        .set(val);
      this.$router.replace('play');
    },
    /**
     * Passed to child to update dataset on event
     */
    updateDataset(newDataset) {
      this.dataset = newDataset;
      this.bucket = this.studies[newDataset].bucket;
    },
    /**
     * What datasets the user can access
     */
    async activateDatasets() {
      const currentUser = firebase.auth().currentUser;
      if (currentUser) {
        firebase.database().ref(`/uids/${currentUser.uid}/datasets`).once('value')
          .then((snap) => {
            this.datasetPrivileges = snap.val();
          });
      }
    },
    updateDatasetPermissions() {
      this.activateDatasets();
    },
    async getStudies() {
      this.db.ref('studies').on('value', (snap) => {
        this.studies = snap.val();
      });
    },
    async getGlobusAllowdOrgs() {
      this.db.ref('config/allowedGlobusOrganizations').on('value', (snap) => {
        this.globusAllowedOrgs = snap.val();
      });
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
    async getMaintenanceStatus() {
      this.db.ref('config/maintenance').on('value', (snap) => {
        this.maintenanceDate = snap.val().date;
        this.maintenanceStatus = snap.val().bannerStatus;
      });
    },
  },
  /**
   * intialize the animate on scroll library (for tutorial) and listen to authentication state
   */
  async created() {
    await this.activateDatasets();
    await this.getStudies();
    await this.getGlobusAllowdOrgs();
    await this.getMaintenanceStatus();
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
  height: 10vh;
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
</style>
