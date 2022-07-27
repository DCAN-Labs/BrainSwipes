<template>
  <b-container>
    <div v-if="allowed">
      <div class="chats-div" v-if="!noData">
        <h1>Chats</h1>
        <p class="lead">See which samples people are talking about</p>
        <p v-for="(c, index) in sampleChat" :key="index">
          <b-alert :variant="flagged.includes(c['.key']) ? 'danger' : 'primary'" show>
            <router-link :to="'/' + dataset + '/review/' + c['.key'] + '/' + btoaBucket">{{c['.key']}}</router-link>
            <br>
            <span v-if="chatInfo[c['.key']]">
              <b>{{chatInfo[c['.key']].username}}</b> : {{chatInfo[c['.key']].message}}
            </span>
          </b-alert>
        </p>
      </div>
      <div v-else>
        <h1>Chats</h1>
        <p class="lead">No one has said anything yet!</p>
        <img :src="blankChatImage" class="blankImage"/>
      </div>
    </div>
  </b-container>
</template>

<script>
/**
 * This is the component for the /chats route. It shows all the chat messages
 * for each sample.
 */
import _ from 'lodash';
import firebase from 'firebase/app';
import 'firebase/auth';

export default {
  firebase() {
    return {
      /**
      * keep track of all the samples that have been discussed.
      */
      sampleChat: {
        source: this.db.ref(`datasets/${this.dataset}/chats`).child('sampleChatIndex').orderByChild('time'),
        readyCallback() {
          this.sampleChat.reverse();
          this.sampleChat.forEach((c) => {
            this.db.ref(`datasets/${this.dataset}/chats`)
              .child('sampleChats')
              .child(c['.key'])
              .orderByKey()
              .limitToLast(1)
              .on('value', (snap) => {
                const data = snap.val();
                this.chatInfo[c['.key']] = data[Object.keys(data)[0]];
                this.$forceUpdate();
              });
          });

          if (!this.sampleChat.length) {
            this.noData = true;
          }
        },
      },
      flagged: {
        source: this.db.ref(`datasets/${this.dataset}/flaggedSamples`),
        readyCallback() {
          this.flagged = _.reduce(this.flagged, (r, v) => {
            r.push(v['.key']);
            return r;
          }, []);
        },
      },
    };
  },
  data() {
    return {
      /**
       *
       */
      chatInfo: {},
      /**
       * A flag to tell us if the /chats doc is empty on firebase.
       */
      noData: false,
      /**
       * if the user is allowed to see this dataset
       */
      allowed: false,
    };
  },
  props: {
    /**
     * The config object that is loaded from src/config.js.
     * It defines how the app is configured, including
     * any content that needs to be displayed (app title, images, etc)
     * and also the type of widget and where to update pointers to data
     */
    config: {
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
     * the dataset to swipe on
     */
    dataset: {
      type: String,
      required: true,
    },
    /**
     * the s3 bucket where the images for the dataset are held
     */
    bucket: {
      type: String,
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
     * List of studies from the db
     */
    studies: {
      type: Object,
      required: true,
    },
  },
  computed: {
    /**
     * A blank image from the config file. If this.noData is true, this image is rendered.
     */
    blankChatImage() {
      return this.config.chats.blankImage;
    },
    btoaBucket() {
      return btoa(this.bucket);
    },
  },
  /**
   * Prevents navigation to Chats when the dataset prop does not match the route name
    * or if globus authentication is incorrect
    */
  beforeRouteEnter(to, from, next) {
    next(async (vm) => {
      /* eslint-disable no-underscore-dangle */
      const available = await vm._props.db.ref(`config/studies/${to.params.dataset}/available`).once('value');
      const restricted = !available.val();
      const errors = [];
      const user = firebase.auth().currentUser;
      const snap = await vm._props.db.ref(`uids/${user.uid}`).once('value');
      const currentUserInfo = snap.val();
      const userAllowed = currentUserInfo.datasets[to.params.dataset];
      if (to.params.dataset !== vm.dataset) {
        vm.$router.replace({ name: 'Home' });
      } else if (restricted) {
        const email = user.email;
        const identities = await vm._props.getGlobusIdentities(vm._props.globusToken);
        /* eslint-enable no-underscore-dangle */
        const organization = currentUserInfo.organization;
        if (Object.keys(identities).length === 0) {
          errors.push(1);
        } else if (!identities[email]) {
          errors.push(2);
        } else if (identities[email][0] !== organization) {
          errors.push(3);
        } else if (identities[email][1] !== 'used') {
          errors.push(4);
        }
      } if (errors.length) {
        vm.$router.replace({ name: 'Restricted', query: { errors } });
      } else if (userAllowed) {
      /* eslint-disable */
      vm.allowed = true;
      /* eslint-enable */
      }
    });
  },
  beforeRouteUpdate(to, from, next) {
    next({ name: 'Home', query: { reroute: to.fullPath } });
  },
};
</script>

<style>
  .blankImage {
    max-width: 500px;
  }
  .chats-div {
    padding-bottom: 12vh !important;
  }
</style>
