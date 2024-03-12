<template name="play">
  <div id="play" class="container">
     <b-modal
      id="userfeedback" 
      title-html="<h1>Thanks for swiping!</h1>"
      ref="userfeedback"
      size="md"
      ok-only
      ok-title="Keep Swiping"
    >
    <p>{{feedback1}}</p>
    <p>{{feedback2}}</p>
    </b-modal>
    <div v-if="allowed" class="main">
      <div v-if="!completedTutorialRequirements">
        <h1>You must complete additional tutorials to swipe this dataset.</h1>
        <div v-for="tutorial in neededTutorials" :key="tutorial">
          <h3>{{config.learn.tutorials[tutorial].name}}</h3>
        </div>
        <b-button class="btn-swipes" @click="routeTo('TutorialSelect')">To Tutorials</b-button>
      </div>

      <div v-else>

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
            :zoom="zoom"
          />
        </div>
      </div>
      <div id="play-menu">
        <p class="zoom-btn" :class="zoom ? 'zoom-out' : 'zoom-in'" @click="zoom = !zoom"></p>
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


  #play-menu p{
    position: absolute;
    left: -40px;
    top: 15vh;
    transition: 0.3s;
    padding: 15px;
    width: 60px;
    text-decoration: none;
    font-size: 20px;
    border-radius: 0 5px 5px 0;
    background-color: #800000;
  }

  #play-menu p:hover {
    left: 0;
    cursor: pointer;
  }

  .zoom-btn {
    display: none;
  }

  @media (min-width: 65em) {
    .zoom-btn {
      display: unset;
    }

    .zoom-in::before{
      display: block;
      content: ' ';
      background-image: url('../assets/zoom-in.svg');
      background-repeat: no-repeat;
      background-size: 24px 24px;
      height: 24px;
      width: 24px;
    }
    .zoom-out::before{
      display: block;
      content: ' ';
      background-image: url('../assets/zoom-out.svg');
      background-repeat: no-repeat;
      background-size: 24px 24px;
      height: 24px;
      width: 24px;
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
      /**
       * brainswipes configuration from firebase
       */
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
        /*
         * zoom in on the widget
         */
        zoom: false,
        /**
         * results of recent user catch trials for feedback modal
         */
        feedback1: '',
        feedback2: '',
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
        // eslint-disable-next-line no-unused-expressions
        this.widgetPointer ? this.db.ref(`datasets/${currentDataset}/sampleSummary`).child(this.widgetPointer).once('value', (snap) => {
          this.widgetSummary = snap.val();
        }) : null;
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
              const tutorialComplete = this.userData.tutorials[tutorial] === 'complete';
              completedTutorialRequirements = completedTutorialRequirements && tutorialComplete;
            }
          });
        }
        return completedTutorialRequirements;
      },
      neededTutorials() {
        const neededTutorials = [];
        if (Object.hasOwn(this.config.datasets[this.dataset], 'tutorials')) {
          Object.keys(this.config.datasets[this.dataset].tutorials).forEach((tutorial) => {
            if (this.config.datasets[this.dataset].tutorials[tutorial]) {
              let tutorialComplete = false;
              if (Object.hasOwn(this.userData, 'tutorials')) {
                if (this.userData.tutorials[tutorial] === 'complete') {
                  tutorialComplete = true;
                }
              }
              if (!tutorialComplete) {
                neededTutorials.push(tutorial);
              }
            }
          });
        }
        return neededTutorials;
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
            this.sampleCounts = _.map(sampleCounts, (val, key) => {
              const returnValue = { '.key': key, '.value': val };
              return returnValue;
            });
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
          this.catchSampleCounts = _.map(sampleCounts, (val, key) => {
            const returnValue = { '.key': key, '.value': 0 };
            return returnValue;
          });
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
            this.userSeenSamples = _.map(snap.val(), (val, key) => {
              const returnValue = { '.key': key, '.value': val };
              return returnValue;
            });
          });
      },
      /**
       * Initialize the samples the current dataset will use as catch trials
       */
      initSeenCatchSamples(dataset) {
        this.db.ref(`datasets/${dataset}/catch/userSeenSamples`)
          .child(this.userInfo.displayName)
          .once('value', (snap) => {
            this.userSeenCatchSamples = _.map(snap.val(), (val, key) => {
              const returnValue = { '.key': key, '.value': val };
              return returnValue;
            });
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
          array[currentIndex] = array[randomIndex];
          array[randomIndex] = temporaryValue;
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
            if (samplesRemain.length > 1) {
              const secondLowestUnseen = samplesRemain[1]['.value'];
              const secondSmallestSamples = _.filter(samplesRemain, c => c['.value'] === secondLowestUnseen);
              return this.shuffle(samplesSmallest).concat(this.shuffle(secondSmallestSamples));
            }
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
      * next, it will send the user response to the db
      * then it will update the user's score and the sample's view count
      * last, it will set the next sample.
      */
      sendWidgetResponse(response) {
        const currentDataset = this.playMode === 'catch' ? `${this.dataset}/catch` : this.dataset;

        // 2. send the widget data
        const timeDiff = new Date() - this.startTime;
        this.sendVote(response, timeDiff, currentDataset);

        // 3. update the score and count for the sample
        const summary = this.$refs.widget.getSummary(response);
        this.updateScore();
        this.updateRecentCatchTrials(response);
        this.updateSummary(summary, currentDataset);
        this.updateCount(currentDataset);
        this.updateSeen(currentDataset);
        this.sendFeedback();

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
          const samplePriority = this.sampleUserPriority(this.playMode);
          if (samplePriority.length > 1 && samplePriority[0]['.key'] === this.widgetPointer) {
            sampleId = samplePriority[1];
          } else {
            sampleId = samplePriority[0];
          }
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
      * this method update's the user's score by 1;
      */
      updateScore() {
        this.db.ref('users')
          .child(this.userInfo.displayName)
          .child('score')
          .transaction(score => (score || 0) + 1);
        this.db.ref(`users/${this.userInfo.displayName}/datasets/${this.dataset}/score`)
          .transaction(score => (score || 0) + 1);
      },
      /**
       * Update recent catch trial results
       */
      updateRecentCatchTrials(response) {
        if (this.playMode === 'catch') {
          this.db.ref(`datasets/${this.dataset}/catch/sampleCounts/${this.widgetPointer}`).once('value', (snap) => {
            const value = snap.val();
            const result = (response === 1 && value === 'pass') || (response === 0 && value === 'fail');
            this.db.ref(`users/${this.userInfo.displayName}/datasets/${this.dataset}/catch`)
              .transaction(catchTrials => (this.recentCatchTrials(catchTrials, result)));
          });
        }
      },
      recentCatchTrials(catchTrials, result) {
        if (catchTrials) {
          catchTrials.push(result);
          if (catchTrials.length > 5) {
            catchTrials.shift();
          }
          return catchTrials;
        }
        return [result];
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
              val['.value'] += 1;
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
       * Sends feedback every 100 swipes
       */
      sendFeedback() {
        this.db.ref(`users/${this.userInfo.displayName}/datasets/${this.dataset}`).once('value', (snap) => {
          const values = snap.val();
          if (values.score % 100 === 0) {
            this.feedback1 = `You've swiped ${this.dataset} images ${values.score} times!`;
            if (Object.hasOwn(values, 'catch')) {
              let catchTotals = 0;
              values.catch.forEach((result) => {
                if (result) {
                  catchTotals += 1;
                }
              });
              const catchRatio = catchTotals / values.catch.length;
              if (catchRatio > 0.8) {
                this.feedback2 = 'You are swiping with high accuracy! Keep up the good work!';
              } else if (catchRatio > 0.6) {
                this.feedback2 = 'You are swiping well! Be sure to stay focused as you have missed a few images.';
              } else {
                this.feedback2 = 'Our metrics show you are swiping with low accuracy. Consider refreshing your knowledge with the tutorials.';
              }
            }
            this.$refs.userfeedback.show();
          }
        });
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
          if (vm.globusToken.length) {
            const email = user.email;
            const response = await vm._props.getGlobusIdentities(vm._props.globusToken);
            const identities = response.identities;
            const identityProviders = response.included.identity_providers;
            /* eslint-enable no-underscore-dangle */
            const organization = idTokenResult.claims.org;
            // check to see if the email in swipes is linked to the globus account
            let hasSwipesEmail = false;
            identities.forEach((identity) => {
              let identityEmail = '';
              if (Object.hasOwn(identity, 'email')) {
                if (identity.email != null) {
                  identityEmail = identity.email.toString();
                }
              }
              if (identityEmail.toLowerCase() === email.toLowerCase()) {
                hasSwipesEmail = true;
              }
            });
            // check to see if the organiztion the user is registered
            // with is linked to the globus account
            let hasOrg = false;
            let orgUsed = false;
            identityProviders.forEach((provider) => {
              if (provider.name === organization) {
                hasOrg = true;
                const domains = provider.domains;
                identities.forEach((identity) => {
                  let identityEmail = '';
                  if (Object.hasOwn(identity, 'email')) {
                    if (identity.email != null) {
                      identityEmail = identity.email;
                    }
                  }
                  domains.forEach((domain) => {
                    if (identityEmail.includes(domain)) {
                      if (identity.status === 'used') {
                        orgUsed = true;
                      }
                    }
                  });
                });
              }
            });
            if (identities.length === 0) {
              errors.push('noIdentities');
            } else if (!hasSwipesEmail) {
              errors.push('noSwipesEmail');
            } else if (!hasOrg) {
              errors.push('noSwipesOrg');
            } else if (!orgUsed) {
              errors.push('orgNotUsed');
            }
            if (errors.length) {
              vm.$router.push({ name: 'Restricted', query: { errors } });
            }
          }
        }
        if (userAllowed) {
          vm.allowed = true;
        }
      });
    },
  };
</script>
