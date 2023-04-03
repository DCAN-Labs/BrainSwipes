<template name="play">
  <div id="play" class="container">

    <div v-if="allowed" class="main">
      <div v-if="!completedTutorialRequirements">
        <h1>You must complete additional tutorials to swipe this dataset.</h1>
        <div v-for="tutorial in Object.keys(config.datasets[dataset].tutorials)" :key="tutorial">
          <h2>{{config.learn.tutorials[tutorial].name}}</h2>
          <b-button class="btn-swipes" @click="routeTo('Tutorial')">To Tutorial</b-button>
        </div>
      </div>

      <div v-else>
        <b-alert :show="dismissCountDown"
          :variant="feedback.variant"
          class="toast"
          @dismissed="dismissCountdown=0"
          @dismiss-count-down="countDownChanged">
          {{feedback.message}}
        </b-alert>

        <div v-if="noData">
          <h1>Didn't find any samples to display</h1>
          <p class="lead">Try refreshing the page, otherwise this dataset might not be set up yet.</p>
          <img class="blankImage" :src="blankImage" alt="there is no data" />
        </div>

        <div v-else>
          <div v-if="!widgetPointer">
            <Flask />
            <p class="mt-3 pt-3 lead">loading...</p>
          </div>

          <ImageSwipe
          v-else
          :widgetPointer="widgetPointer"
          :widgetSummary="widgetSummary"
          v-on:widgetRating="sendWidgetResponse"
          :playMode="playMode"
          ref="widget"
          :dataset="dataset"
          :study="study"
          :config="config"
          />
        </div>
      </div>
    </div>

  </div>
</template>

<style>
  /*https://github.com/pudymody/tinderSwipe/blob/gh-pages/style.css*/

  .main {
    min-height: 80vh;
  }

  .toast {
    width: auto;
    max-width: 200px;
    top: 60px;
    left: 0;
    margin: auto;
    position: absolute;
    right: 0;
    z-index: 999;
  }

  .blankImage {
    max-width: 500px;
  }

  @media (max-height: 683px){
    .container {
      padding-bottom: 12.5vh;
    }
  }


</style>

<script>
  /**
   * This is the component for the `/play` route.
   *
   * This component is responsible for the following:
   * 1. Deciding which sample to present by choosing an item in `/sampleCounts`
   * that has been seen the least number of times, but also making sure the user
   * hasn't seen that sample yet (by reading from `/userSeenSamples/<username>`).
   * 2. sending the user's response from the widget. This includes:
   *   1. getting feedback from the widget and displaying it.
   *   2. saving the response and the time it took to make the response
   *      (pushes to `/votes` in firebase)
       3. Updating the user's score
       4. Updating that sample's count
       5. Updating that the user has seen the sample
       6. Updating that sample's summary
       7. And then loading the next sample to view.
   */
  import _ from 'lodash';
  import firebase from 'firebase/app';
  import 'firebase/auth';
  import Vue from 'vue';
  import ImageSwipe from './Widgets/ImageSwipe';
  import Flask from './Animations/Flask';

  Vue.component('ImageSwipe', ImageSwipe);

  export default {
    name: 'play',
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
       * the dataset to swipe on
       */
      dataset: {
        type: String,
        required: true,
      },
      /**
       * the study the dataset falls under
       */
      study: {
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
      config: {
        type: Object,
        required: true,
      },
    },
    data() {
      return {
        /**
         * keep track of the time a user took to vote on a sample
         */
        startTime: null,
        /**
         * flags for the small toast that shows feedback
         */
        dismissSecs: 1,
        /**
         * flags for the small toast that shows feedback
         */
        dismissCountDown: 0,

        /**
         * feedback will be filled by the widget component
         * for now its initialized here
         */
        feedback: {
          variant: 'warning',
          message: '',
        },

        /**
         * status flag that is set to "complete" when the firebase keys are filled.
         */
        status: 'loading',

        /**
         * these keys will be filled by firebase when the component is mounted
         */
        sampleCounts: [],
        catchSampleCounts: [],
        userSeenSamples: [],
        userSeenCatchSamples: [],

        /**
         * if sampleCounts is empty after its fetched from the db, then noData
         * flag is set to true. TODO: prompt the user to the setup instructions
         */
        noData: false,

        /**
         * widgetPointer is a pointer to the keys in sampleCounts, sampleSummary, and sampleChats
         */
        widgetPointer: null,

        /**
         * widget summary comes from firebase when the widget Pointer is set.
         */
        widgetSummary: {},
        /**
         * whether the user is allowed to see this dataset
         */
        allowed: false,
        /**
         * whether the widget should be in play mode or catch trial mode
         */
        playMode: 'play',
        /**
         * if there is nothing in the database, display a blank image
         */
        blankImage: 'https://raw.githubusercontent.com/SwipesForScience/testConfig/master/images/undraw_blank_canvas.svg?sanitize=true',
      };
    },
    watch: {
      /**
       * Watch the widget pointer, which is from `/sampleCounts` document in firebase.
       * When it changes, also update the `widgetSummary` to be from the new `widgetPointer`.
       */
      widgetPointer() {
        const currentDataset = this.playMode === 'play' ? this.dataset : `${this.dataset}/catch`;
        /* eslint-disable */
        this.widgetPointer ? this.db.ref(`datasets/${currentDataset}/sampleSummary`).child(this.widgetPointer).once('value', (snap) => {
          this.widgetSummary = snap.val();
        }) : null;
        /* eslint-enable */
      },
    },
    /**
     * When the component mounts, initialize the sampleCounts from firebase,
     * and also the samples the user has seen.
     */
    mounted() {
      this.initSampleCounts(this.dataset);
      this.initCatchSampleCounts(this.dataset);
      this.initSeenSamples(this.dataset);
      this.initSeenCatchSamples(this.dataset);
    },
    components: {
      Flask,
    },
    computed: {
      /**
       * sort the sampleCounts from firebase by their value, where the lowest count is first.
       */
      samplePriority() {
        return _.sortBy(this.sampleCounts, '.value');
      },
      catchSamplePriority() {
        return _.sortBy(this.catchSampleCounts, '.value');
      },
      completedTutorialRequirements() {
        let completedTutorialRequirements = true;
        if (Object.hasOwn(this.config.datasets[this.dataset], 'tutorials')) {
          Object.keys(this.config.datasets[this.dataset].tutorials).forEach((tutorial) => {
            if (this.config.datasets[this.dataset].tutorials[tutorial]) {
              completedTutorialRequirements =
                completedTutorialRequirements && this.userData.tutorials[tutorial];
            }
          });
        }
        return completedTutorialRequirements;
      },
    },
    methods: {
      /**
       * Ask Firebase for the sampleCounts document,
       * but don't watch it in real time, just fetch the data once.
       */
      initSampleCounts(dataset) {
        this.db.ref(`datasets/${dataset}/sampleCounts`).once('value', (snap) => {
          this.db.ref(`datasets/${dataset}/flaggedSamples`).once('value', (snap2) => {
            let flaggedSamples = [];
            if (snap2.val()) {
              flaggedSamples = Object.keys(snap2.val());
            }
            const sampleCounts = _.omit(snap.val(), flaggedSamples);
            /* eslint-disable */
            this.sampleCounts = _.map(sampleCounts, (val, key) => {
              return { '.key': key, '.value': val };
            });
            /* eslint-enable */
            if (!this.sampleCounts.length) {
              this.noData = true;
            } else {
              this.startTime = new Date();
              this.setNextSampleId();
            }
          });
        });
      },
      initCatchSampleCounts(dataset) {
        this.db.ref(`datasets/${dataset}/catch/sampleCounts`).once('value', (snap) => {
          const sampleCounts = snap.val();
          /* eslint-disable */
          this.catchSampleCounts = _.map(sampleCounts, (val, key) => {
            return { '.key': key, '.value': 0 };
          });
          /* eslint-enable */
        });
      },
      /**
       * Initialize the samples that the user has seen, by fetching the
       * `/userSeenSamples/<username>` document from firebase, once.
       */
      initSeenSamples(dataset) {
        this.db.ref(`datasets/${dataset}/userSeenSamples`)
          .child(this.userInfo.displayName)
          .once('value', (snap) => {
            /* eslint-disable */
            this.userSeenSamples = _.map(snap.val(), (val, key) => {
              return { '.key': key, '.value': val };
            });
            /* eslint-enable */
          });
      },
      /**
       * Initialize the samples the current dataset will use as catch trials
       */
      initSeenCatchSamples(dataset) {
        this.db.ref(`datasets/${dataset}/catch/userSeenSamples`)
          .child(this.userInfo.displayName)
          .once('value', (snap) => {
            /* eslint-disable */
            this.userSeenCatchSamples = _.map(snap.val(), (val, key) => {
              return { '.key': key, '.value': val };
            });
            /* eslint-enable */
          });
      },
      /**
       * A method to shuffle an array.
       */
      shuffle(array) {
        // a method to shuffle an array, from
        // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
        let currentIndex = array.length;
        let temporaryValue;
        let randomIndex;
        // While there remain elements to shuffle...
        while (currentIndex !== 0) {
          // Pick a remaining element...
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex -= 1;
          // And swap it with the current element.
          temporaryValue = array[currentIndex];
          /* eslint-disable */
          array[currentIndex] = array[randomIndex];
          array[randomIndex] = temporaryValue;
          /* eslint-enable */
        }
        return array;
      },
      /**
      * A method that returns an array of samples prioritized by
      * the least seen overall and by the user
      */
      sampleUserPriority(playMode) {
        const userSeenSamples = playMode === 'catch' ? this.userSeenCatchSamples : this.userSeenSamples;
        const samplePriority = playMode === 'catch' ? this.catchSamplePriority : this.samplePriority;
        // if the user is logged in then,
        if (this.userInfo) {
          // remove all the samples that the user has seen
          let samplesRemain;
          if (userSeenSamples) {
            // if the user has seen some samples, remove them
            const userSeenList = _.map(userSeenSamples, s => s['.key']);
            samplesRemain = _.filter(samplePriority,
              v => userSeenList.indexOf(v['.key']) < 0);

            // but if the user has seen everything,
            // return the total sample priority
            samplesRemain = samplesRemain.length ? samplesRemain : samplePriority;
          } else {
            // the user hasn't seen anything yet, so all samples remain
            samplesRemain = samplePriority;
          }

          if (samplesRemain.length) {
            // some samples remain to be seen.
            // get the smallest value that hasn't been seen by user yet.
            // samplesRemain is sorted, so the first value has been seen the
            // least number of times.
            const minUnseen = samplesRemain[0]['.value'];
            // then filter the rest of the samples
            // so they are only the smallest seen value;
            const samplesSmallest = _.filter(samplesRemain, c => c['.value'] === minUnseen);
            // and then randomize the order;
            return this.shuffle(samplesSmallest);
          }

          // TODO: check whether we actually hit this line. If we don't, remove it.
          return this.shuffle(samplePriority);
        }
        // if samplePriority was empty the whole time, return null
        return null;
      },
      /**
      * this method is called from the child widget
      * it will first get feedback from the child on the response
      * next, it will send the user response to the db
      * then it will update the user's score and the sample's view count
      * last, it will set the next sample.
      */
      sendWidgetResponse(response) {
        // 1. get feedback from the widget, and display if needed
        const feedback = this.$refs.widget.getFeedback(response);
        if (feedback.show) {
          this.feedback = feedback;
          this.showAlert();
        }

        const currentDataset = this.playMode === 'catch' ? `${this.dataset}/catch` : this.dataset;

        // 2. send the widget data
        const timeDiff = new Date() - this.startTime;
        this.sendVote(response, timeDiff, currentDataset);

        // 3. update the score and count for the sample
        this.updateScore(this.$refs.widget.getScore(response));
        this.updateSummary(this.$refs.widget.getSummary(response), currentDataset);
        this.updateCount(currentDataset);
        this.updateSeen(currentDataset);

        // 3. clear router query if exists
        if (this.$route.query.s) {
          this.clearRouterQuery();
        }
        // 3. set the next Sample
        this.setNextSampleId();
      },
      /**
      * method to get the next sample id to show in the widget
      * view time gets reset first, then the new sample is found and set.
      */
      setNextSampleId() {
        this.startTime = new Date();

        let sampleId = '';

        if (this.$route.query.s) {
          sampleId = { '.key': Buffer.from(this.$route.query.s, 'base64').toString('ascii') };
          this.playMode = 'play';
        } else {
          if (Math.random() < this.config.catchTrials.frequency && this.catchSampleCounts.length) {
            this.playMode = 'catch';
          } else {
            this.playMode = 'play';
          }
          sampleId = this.sampleUserPriority(this.playMode)[0];
        }

        // if sampleId isn't null, set the widgetPointer
        if (sampleId) {
          this.widgetPointer = sampleId['.key'];
        }
      },
      /**
      * the user's response for the sample is sent to the db
      * along with their user displayName and the time they took to respond.
      */
      sendVote(response, time, dataset) {
        this.db.ref(`datasets/${dataset}/votes`).push({
          user: this.userInfo.displayName,
          sample: this.widgetPointer,
          response,
          time,
          datetime: Date.now(),
        });
      },
      /**
      * this method update's the user's score by scoreIncrement;
      */
      updateScore(scoreIncrement) {
        this.db.ref('users')
          .child(this.userInfo.displayName)
          .child('score')
          .transaction(score => (score || 0) + scoreIncrement);
      },
      /**
       * Update the summary of a given widgetPointer
       */
      updateSummary(summary, dataset) {
        this.db.ref(`datasets/${dataset}/sampleSummary`)
          .child(this.widgetPointer)
          .set(summary);
      },
      /**
       * Update the sampleCount of the current widgetPointer.
       */
      updateCount(dataset) {
        if (this.playMode !== 'catch') {
          // update the firebase database copy
          this.db.ref(`datasets/${dataset}/sampleCounts`)
            .child(this.widgetPointer)
            .transaction(count => (count || 0) + 1);
  
          // update the local copy
          _.map(this.sampleCounts, (val) => {
            if (val['.key'] === this.widgetPointer) {
              /* eslint-disable */
              val['.value'] += 1;
              /* eslint-enable */
            }
          });
        }
      },
      /**
       * Update that the user has seen this sample, incrementing by 1.
       */
      updateSeen(dataset) {
        // mark that this user has seen this widgetPointer
        // update the firebase database copy
        this.db.ref(`datasets/${dataset}/userSeenSamples`)
          .child(this.userInfo.displayName)
          .child(this.widgetPointer)
          .transaction(count => (count || 0) + 1);

        // update the local copy
        this.userSeenSamples.push({ '.key': this.widgetPointer, '.value': 1 });
      },
      /**
       * This is for the toast component that shows feedback, to keep track of time.
       */
      countDownChanged(dismissCountDown) {
        this.dismissCountDown = dismissCountDown;
      },
      /**
       * This is to show the toast alert component, for widget feedback.
       */
      showAlert() {
        this.dismissCountDown = this.dismissSecs;
      },
      /**
       * removes the router query
       */
      clearRouterQuery() {
        this.$router.push({ name: 'Home', query: { reroute: `${this.study}/${this.dataset}/play` } });
      },
      routeTo(route) {
        this.$router.push({ name: route });
      },
    },
    /**
     * Prevents navigation to Play when the dataset prop does not match the route name
     * or if globus authentication is incorrect
     */
    beforeRouteEnter(to, from, next) {
      next(async (vm) => {
        /* eslint-disable no-underscore-dangle */
        const available = await vm._props.db.ref(`config/studies/${to.params.study}/available`).once('value');
        const restricted = !available.val();
        const errors = [];
        const user = firebase.auth().currentUser;
        const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
        const userAllowed = idTokenResult.claims.datasets[to.params.study];
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
  };
</script>
