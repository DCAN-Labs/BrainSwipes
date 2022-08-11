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
      <h1>Samples you've commented on</h1>
      <div class="user-chats">
        <div v-for="study in Object.keys(userChats)" :key="study" class="study-chats-wrapper">
          <div class="study-chats">
            <h2>{{study}}</h2>
            <!-- <router-link :to="'/review/' + c">{{c}}</router-link>: -->
            <router-link v-for="c in userChats[study]" :key="c.sample" class="single-chat" :to="`${study}/review/${c.sample}?f=p`">
              <b-alert show>
                <h3>{{c.sample}}</h3>
                <br>
                <span >
                  <b>{{c.username}}</b> : {{c.message}}
                </span>
              </b-alert>
            </router-link>
          </div>
        </div>
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

  .single-chat h3{
    font-weight: 600;
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
          this.db.ref(`datasets/${study}/chats/sampleChats`).on('value', (snap) => {
            const data = snap.val();
            const currentUserChats = _.reduce(data, (result, value, key) => {
              if (_.filter(Object.values(value), { username: this.userInfo.displayName }).length) {
                // eslint-disable-next-line
                result[key] = value;
              }
              return result;
            }, {});
            const mostRecentMessages = _.reduce(currentUserChats, (result, value, key) => {
              const values = value[Object.keys(value)[Object.keys(value).length - 1]];
              result.push({
                sample: key,
                message: values.message,
                time: values.time,
                username: values.username,
              });
              return result;
            }, []);
            const studyChats = _.orderBy(mostRecentMessages, 'time', 'desc');
            // userChats[study] = studyChats;
            Vue.set(this.userChats, study, studyChats);
          });
        }
      });
    },
  },
  mounted() {
    this.getUserChats();
  },
};
</script>
