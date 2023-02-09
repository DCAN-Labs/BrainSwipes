<template>
  <div id="profile">
    <!-- Only show stuff is the user is authenticated -->
    <b-container>
      <!-- userInfo is a prop that was passed in from App -->
      <h1>
        {{userInfo.displayName}}
      </h1>

      <p class="lead">
        You have {{userData.score}} points!
      </p>
      <hr>
      <h1>
        {{yourEmail}}
      </h1>
      <p>
        {{verificationStatus}}
      </p>
      <b-form v-if="!verified" @submit="verifyEmail">
        <b-button id="verifyEmail" type="submit" variant="primary">Verify Email</b-button>
      </b-form>
      <hr>
      <div class="profile-pic-options">
        <h1>Choose a Profile Picture!</h1>
        <br>
        <img v-for="pic in profilePics" :key="pic" :src="`/static/profile_pics/${pic}.svg`" v-on:click="setProfilePic(pic)">
      </div>
      <hr>
      <h1>Samples you've commented on</h1>
      <div v-if="Object.keys(userChats).length" class="user-chats">
        <div v-for="study in Object.keys(userChats)" :key="study" class="study-chats-wrapper">
          <div>
            <div class="study-title-wrapper">
              <div class="study-title">
                <h2>{{study}}</h2>
                <span  :class="{ messagestudy: notifications[study] }"></span>
              </div>
            </div>
            <div v-if="config.studies[study].available" class="study-chats" :class="{ scroller: Object.keys(userChats[study]).length > 4 }">
                <div v-for="c in userChats[study]" v-on:click="onChatClick(study, c.sample)" :key="c.sample" class="single-chat" :class="{ pulse: c.notify[userInfo.displayName] }">
                  <div :class="{ messagechat: c.notify[userInfo.displayName] }"></div>
                  <h3>{{c.sample}}</h3>
                  <br>
                  <span >
                    <b>{{c.username}}</b> : {{c.message}}
                  </span>
                </div>
            </div>
            <div v-else>
              <div v-if="globusAuthenticated">
                <div v-for="c in userChats[study]" v-on:click="onChatClick(study, c.sample)" :key="c.sample" class="single-chat" :class="{ pulse: c.notify[userInfo.displayName] }">
                  <div :class="{ messagechat: c.notify[userInfo.displayName] }"></div>
                  <h3>{{c.sample}}</h3>
                  <br>
                  <span >
                    <b>{{c.username}}</b> : {{c.message}}
                  </span>
                </div>
              </div>
              <div v-else>
                <p v-for="error in globusAuthErrors" :key="error" class="globus-auth-error">{{errorCodes[error]}}</p>
                <b-button @click="routeToRestricted">Login with Globus</b-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <br>
        <p>Add a comment on a sample by clicking the Help button</p>
        <img :src="blankImage" class="blankImage"/>
      </div>

    </b-container>

  </div>
</template>

<style>

  #profile {
    min-height: 100vh;
  }

  .blankImage {
    max-width: 500px;
  }

  .user-chats {
    padding-bottom: 12vh;
  }

  .study-chats {
    max-width: 500px;
  }

  .study-chats-wrapper {
    display: flex;
    justify-content: center;
  }

  .user-chats h2 {
    font-weight: 600;
    font-size: 1.2em;
    padding: 0.4em;
  }

  .single-chat {
    padding: 1em;
    margin: 10px;
    background-color: #CCE5FF;
    position: relative;
  }

  .single-chat h3{
    font-weight: 600;
  }

  .single-chat:hover{
    cursor: pointer;
  }

  .single-chat:hover h3{
    text-decoration: underline;
  }

  .scroller {
    overflow-y: scroll;
    max-height: 360px;
  }

  .pulse {
    animation: pulse 6s;
    animation-iteration-count: infinite;
    background-color: #FFF3CD;
  }

  .messagechat {
    position: absolute;
    right: 15px;
  }

  .messagechat::after {
    display: block;
    content: '';
    background-image: url('../assets/envelope-fill.svg');
    background-repeat: no-repeat;
    background-size: 16px 16px;
    height: 16px;
    width: 16px;
  }

  .messagestudy {
    position: absolute;
    right: 0px;
    top: 0.5em;
  }

  .messagestudy::after {
    display: block;
    content: '';
    background-image: url('../assets/envelope-fill.svg');
    background-repeat: no-repeat;
    background-size: 16px 16px;
    height: 16px;
    width: 16px;
  }

  .study-title-wrapper {
    display: flex;
    justify-content: center;
    max-width: 500px;
    position: relative;
    align-items: baseline;
  }

  .study-title {
    position: relative;
    padding: 0 16px 0 16px;
  }

  .globus-auth-error {
    background-color: #F8D7DA;
    padding: 5px;
    margin: 5px;
  }

  @keyframes pulse {
    0% {background-color: #D1ECF1;}
    50% {background-color: #FFF3CD;}
    100% {background-color: #D1ECF1;}
  }

  .profile-pic-options img{
    height: 4em;
    margin: 2px;
  }

</style>

<script>
/**
 * The profile component that's shown on the /profile route.
 * It displays the number of points a user has earned
 * It shows the badges they've earned and greys out the ones they still need to earn
 * It shows a chats section, which are the discussions this user has participated in
 * if the user hasn't said anything, then it shows a blank image
 * @author Anisha Keshavan
 * @license Apache 2.0
 */
import firebase from 'firebase/app';
import 'firebase/auth';
import _ from 'lodash';
import Vue from 'vue';

export default {
  name: 'profile',
  data() {
    return {
      /**
       * an image to display if the user hasn't said anything.
       */
      blankImage: 'https://raw.githubusercontent.com/SwipesForScience/testConfig/master/images/undraw_chatting.svg?sanitize=true',
      /**
       * collection of chats the current user has participated in
       */
      userChats: [],
      /**
       * Whether the user has authenticated with Globus
       */
      globusAuthenticated: false,
      globusAuthErrors: [],
      /**
       * List of profile pic options
       */
      profilePics: ['kesh-profile-icon', 'UniversityOfMinnesota', 'dcan-yellow-no-text', 'abide', 'connectome'],
    };
  },
  computed: {
    yourEmail() {
      return firebase.auth().currentUser.email;
    },
    verificationStatus() {
      let verificationStatus;
      if (firebase.auth().currentUser.emailVerified) {
        verificationStatus = 'Your email address is verified.';
      } else {
        verificationStatus = 'Please verify the email associated with this account.';
      }
      return verificationStatus;
    },
    verified() {
      return firebase.auth().currentUser.emailVerified;
    },
  },
  props: {
    /**
     * the authenticated user object from firebase
     */
    userInfo: {
      type: Object,
      required: true,
    },
    /**
     * the computed user data object based on userInfo
     */
    userData: {
      type: Object,
      required: true,
    },
    /**
     * the intialized firebase database
     */
    db: {
      type: Object,
      required: true,
    },
    /**
     * which studies the user can see
     */
    datasetPrivileges: {
      type: Object,
      required: true,
    },
    /**
     * keys: studies that user can access
     * values: does the user have a notification from that study, boolean
     */
    notifications: {
      type: Object,
      required: true,
    },
    /**
     * configuration document from the database
     */
    config: {
      type: Object,
      required: true,
    },
    /**
     * The auth token from Globus
     */
    globusToken: {
      type: String,
      required: true,
    },
    /**
     * function that exchanges the Globus token for user information
     */
    getGlobusIdentities: {
      type: Function,
      required: true,
    },
    /**
     * errors produced by brainswipes
     */
    errorCodes: {
      type: Object,
      required: true,
    },
  },
  methods: {
    /**
     * calls the built in firebase auth function to send the email
     * from the template in the firebase console
     */
    verifyEmail() {
      firebase.auth().currentUser.sendEmailVerification();
    },
    /**
     * gets chats for samples the current user has chatted on
     * for the specified dataset
     */
    getUserChats() {
      // const userChats = {};
      Object.keys(this.datasetPrivileges).forEach(async (study) => {
        if (this.datasetPrivileges[study]) {
          this.db.ref(`datasets/${study}/chats/chats`).on('value', (snap) => {
            const data = snap.val();
            const currentUserChats = _.reduce(data, (result, value, key) => {
              if (_.filter(Object.values(value.chats),
                { username: this.userInfo.displayName, deleted: false }).length) {
                // eslint-disable-next-line
                result[key] = { ...value.chats, notify: value.notify };
              }
              return result;
            }, {});
            const mostRecentMessages = _.reduce(currentUserChats, (result, value, key) => {
              const values = _.orderBy(_.filter(_.omit(value, 'notify'), { deleted: false }), 'time', 'desc')[0];
              result.push({
                sample: key,
                message: values.message,
                time: values.time,
                username: values.username,
                notify: value.notify,
              });
              return result;
            }, []);
            const studyChats = _.orderBy(mostRecentMessages, 'time', 'desc');
            Vue.set(this.userChats, study, studyChats);
          });
        }
      });
    },
    onChatClick(study, sample) {
      this.$router.push(`${study}/review/${sample}?f=p`);
      this.db.ref(`datasets/${study}/chats/chats/${sample}/notify/${this.userInfo.displayName}`).set(false);
    },
    async allowRestrictedChats() {
      const user = firebase.auth().currentUser;
      const email = user.email;
      const identities = await this.getGlobusIdentities(this.globusToken);
      const errors = [];
      const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
      const organization = idTokenResult.claims.org;
      if (Object.keys(identities).length === 0) {
        errors.push(1);
      } else if (!identities[email]) {
        errors.push(2);
      } else if (identities[email][0] !== organization) {
        errors.push(3);
      } else if (identities[email][1] !== 'used') {
        errors.push(4);
      }
      if (errors.length) {
        this.globusAuthErrors = errors;
        this.globusAuthenticated = false;
      } else {
        this.globusAuthenticated = true;
      }
    },
    routeToRestricted() {
      this.$router.push({ name: 'Restricted', query: { errors: this.globusAuthErrors } });
    },
    setProfilePic(pic) {
      this.db.ref(`users/${this.userInfo.displayName}/pic`).set(pic);
    },
  },
  mounted() {
    this.getUserChats();
    this.allowRestrictedChats();
  },
};
</script>
