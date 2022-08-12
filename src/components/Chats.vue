<template>
  <b-container>
    <div v-if="allowed">
      <div class="chats-div" v-if="!noData">
        <h1>Chats</h1>
        <p class="lead">See which samples people are talking about</p>
        <p v-for="c in sampleChats" :key="c.sample">
          <b-alert :variant="flagged.includes(c.sample) ? 'danger' : 'primary'" show>
            <router-link :to="`/${dataset}/review/${c.sample}?f=c`">{{c.sample}}</router-link>
            <br>
            <span >
              <b>{{c.username}}</b> : {{c.message}}
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
      sampleChats: {
        source: this.db.ref(`datasets/${this.dataset}/chats/chats`),
        readyCallback() {
          const chats = _.reduce(this.sampleChats, (result, value) => {
            const existingChats = _.filter(value.chats, { deleted: false });
            if (existingChats.length) {
              const values = Object.values(existingChats)[Object.keys(existingChats).length - 1];
              result.push({ sample: value['.key'], message: values.message, time: values.time, username: values.username });
            }
            return result;
          }, []);
          this.sampleChats = _.orderBy(chats, 'time', 'desc');
          if (!this.sampleChats.length) {
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
       * A flag to tell us if the /chats doc is empty on firebase.
       */
      noData: false,
      /**
       * if the user is allowed to see this dataset
       */
      allowed: false,
      /**
       * A blank image from the original SwipesForScience.
       * If this.noData is true, this image is rendered.
       */
      blankChatImage: 'https://raw.githubusercontent.com/SwipesForScience/testConfig/master/images/undraw_no_data.svg?sanitize=true',
    };
  },
  props: {
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
  },
  methods: {
    getChats() {
      this.db.ref(`datasets/${this.dataset}/chats/sampleChats`).on('value', (snap) => {
        const samples = snap.val();
        const chats = _.reduce(samples, (result, value, key) => {
          const values = value[Object.keys(value)[Object.keys(value).length - 1]];
          result.push({
            sample: key, message: values.message, time: values.time, username: values.username });
          return result;
        }, []);
        const sortedChats = _.orderBy(chats, 'time', 'desc');
        console.log(sortedChats);
      });
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
      const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
      const userAllowed = idTokenResult.claims.datasets[to.params.dataset];
      if (to.params.dataset !== vm.dataset) {
        vm.$router.push({ name: 'Home' });
      } else if (restricted) {
        const email = user.email;
        const identities = await vm._props.getGlobusIdentities(vm._props.globusToken);
        /* eslint-enable no-underscore-dangle */
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
      } if (errors.length) {
        vm.$router.push({ name: 'Restricted', query: { errors } });
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
