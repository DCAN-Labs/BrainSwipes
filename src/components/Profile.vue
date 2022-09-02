<template>
  <div id="profile">
    <!-- Only show stuff is the user is authenticated -->
    <b-container fluid>
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

      <!-- Chats don't currently work with multiple datasets,
      not worth dealing with right now.
      Leaving here in case it matters later. -->

      <!-- <div v-if="chats.length">
        <h2> Your Chats </h2>
        <p class="lead">
          Your discussions on specific samples
        </p>

        <div v-for="c in chats"  class="text-left" :key="c">
          <div v-if="chatInfo[c]">
            <b-alert :show="chatInfo[c].notify">
              <router-link :to="'/listen/' + c">{{c}}</router-link>:
              <b>{{chatInfo[c].username}}</b>
              {{chatInfo[c].message}}
            </b-alert>
            <b-alert :show="!chatInfo[c].notify" variant="light">
              <router-link :to="'/review/' + c">{{c}}</router-link>:
              <b>{{chatInfo[c].username}}</b>
              {{chatInfo[c].message}}
            </b-alert>
          </div>
        </div>
      </div>
      <div v-else>
        <h2> Chats </h2>
        <p class="lead">
          You haven't said anything yet! When you're ready, join the discussion.
        </p>
        <img :src="blankImage" class="blankImage"/>
      </div> -->
    </b-container>

  </div>
</template>

<style>
  .pokemon{
    min-width: 25px;
    min-height: 25px;
    width: 100px;
    height: 100px;
  }

  #profile {
    min-height: 100vh;
  }

  .blankImage {
    max-width: 500px;
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

export default {
  name: 'profile',
  data() {
    return {
      /**
       * chats is filled with pointers to samples that the user has discussed
       * from the firebase database. It is a list.
       */
      chats: [],
      /**
       * chatInfo is filled from the firebase database. For each item in chats,
       * get the most recent discussion point from that chat and store it here.
       */
      chatInfo: {},
      /**
       * an image to display if the user hasn't said anything.
       */
      blankImage: 'https://raw.githubusercontent.com/SwipesForScience/testConfig/master/images/undraw_chatting.svg?sanitize=true',
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
  },
  /**
   * when the component is mounted, it gets the user's chats.
   */
  // mounted() {
  //   if (this.userData['.key']) {
  //     this.getUserChats('BCP');
  //   }
  // },
  // watch: {
  //   /**
  //    * if the user is updated, get their chats. (is this necessary?)
  //    */
  //   userData() {
  //     if (this.userData['.key']) {
  //       this.getUserChats('BCP');
  //     }
  //   },
  //   chats() {
  //     this.watchChats('BCP');
  //   },
  // },
  methods: {
    /**
     * A method to read the firebase db ref /chats/<user_display_name>
     *
     */
    getUserChats(dataset) {
      this.db.ref(`datasets/${dataset}/chats`)
        .child('userChat')
        .child(this.userData['.key'])
        .on('value', (snap) => {
          const data = snap.val();
          if (data) {
            this.chats = Object.keys(data);
          }
        });
    },
    /**
     * for each chat key in the firebase database, update our local chatInfo data.
     * this watcher should update the chats ui in real time.
     */
    watchChats(dataset) {
      this.chats.forEach((c) => {
        this.db.ref(`datasets/${dataset}/chats`)
          .child('sampleChats')
          .child(c)
          .orderByKey()
          .limitToLast(1)
          .on('value', (snap) => {
            const data = snap.val();
            this.chatInfo[c] = data[Object.keys(data)[0]];
            this.getNotifications(c);
            this.$forceUpdate();
          });
      });
    },
    /**
     * In theory this method should set a flag to tell the UI
     * to highlight any chats that have been updated since that last time the user
     * saw their chats. I don't think this method is even called yet.
     */
    getNotifications(key) {
      this.db.ref('notifications')
        .child(this.userData['.key'])
        .child(key)
        .on('value', (snap) => {
          if (snap.val()) {
            this.chatInfo[key].notify = true;
            this.$forceUpdate();
          }
        });
    },
    verifyEmail() {
      firebase.auth().currentUser.sendEmailVerification();
    },
  },
};
</script>
