<template>
  <div class="imageSwipe">
      <transition :key="swipe" :name="swipe" >
        <div class="user-card" :class="zoom ? 'zoom': ''" :key="imgKey">
            <div class="image_area">
              <img class="user-card__picture mx-auto"
                :src="imgUrl"
                v-hammer:swipe.horizontal="onSwipe"
                @error="imageError"
              >
            </div>

            <div class="user-card__name">
              <b-button variant="danger"
                v-if="playMode"
                style="float:left"
                @click="swipeLeft"
                v-shortkey.once="['arrowleft']"
                @shortkey="swipeLeft"
                v-hammer:swipe.left="swipeLeft"
                ref="leftSwipe"
                v-bind:class="{ focus: leftFocused }"
              > <i class="fa fa-long-arrow-left" aria-hidden="true"></i>
              Fail
             </b-button>

             <span style="float:left" v-else>
               <span v-if="widgetSummary"> ave vote: {{widgetSummary.aveVote || 0}} </span>
               <span v-else>ave vote: N/A</span>
             </span>

             <b-button v-if="playMode"
              :to="playMode == 'tutorial' ? '' : `/${study}/${dataset}/review/${widgetPointer}?f=h`"
              ref="helpButton"
              class="helpbtn"
              v-bind:class="{ focus: helpFocused }"
              >Help</b-button>

              <b-button variant="success"
                v-if="playMode"
                style="float:right"
                @click="swipeRight"
                v-shortkey.once="['arrowright']"
                @shortkey="swipeRight"
                ref="rightSwipe"
                v-bind:class="{ focus: rightFocused }"
              > Pass
              <i class="fa fa-long-arrow-right" aria-hidden="true"></i>
              </b-button>

              <span style="float:right" v-else>
                <span v-if="widgetSummary"> num votes: {{widgetSummary.count || 0}} </span>
                <span v-else>num votes: 0</span>
              </span>

            </div>
          </div>
      </transition>
  </div>
</template>

<script>
/**
 * The ImageSwipe widget is the original, https://braindr.us Tinder-like widget
 * where you swipe left to "fail" an image, and swipe right to  "pass" it.
 * it is for binary classification only.
 */
  import _ from 'lodash';
  import Vue from 'vue';
  import { VueHammer } from 'vue2-hammer';
  import imagesLoaded from 'vue-images-loaded';
  import GridLoader from 'vue-spinner/src/PulseLoader';

  Vue.use(VueHammer);
  Vue.use(require('vue-shortkey'));

  export default {
    name: 'ImageSwipe',
    props: {
      /**
       * The sample ID to tell the widget to display.
       */
      widgetPointer: {
        type: String,
        required: true,
      },
      /**
       * The summary data for the widget.
       * This one keeps track of the running average.
      */
      widgetSummary: {
        type: Object,
        required: false,
      },
      /**
      * Tells the widget if it should be in a "play mode" or maybe a "review mode".
      */
      playMode: {
        type: String,
        required: false,
      },
      /**
       * Tells the widget to display a tutorial step.
       * tutorialStep = 0 highlights/glows the fail button.
       * tutorialStep = 1 highlights/glows the pass button.
       * tutorialStep = 2 highlights/glows the help button.
       */
      tutorialStep: {
        type: Number,
        required: false,
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
        required: false,
      },
      /**
       * The config from firebase.
       * Includes information necessary to access the correct image
       */
      config: {
        type: Object,
        required: true,
      },
      /**
       * id for tutorial images
       */
      identifier: {
        type: String,
        required: false,
      },
      /**
       * for zooming in on the image
       */
      zoom: {
        type: Boolean,
        required: false,
      },
    },
    components: { VueHammer, GridLoader },
    directives: {
      imagesLoaded,
    },
    data() {
      return {
        /**
         * the status of the image to load
         */
        status: 'loading',
        /**
         * save the swipe direction.
         */
        swipe: null,
        imgUrl: null,
        imgKey: null,
        rightFocused: false,
        leftFocused: false,
        helpFocused: false,
        /**
         * sets a small delay to prevent double swipes
         */
        lastClick: 0,
        delay: 500,
      };
    },
    /**
     * If the playMode === 'tutorial', show a tutorial step.
     */
    mounted() {
      this.$nextTick(() => {
        if (this.playMode === 'tutorial') {
          this.showTutorialStep(this.tutorialStep);
        }
      });
    },
    async created() {
      await this.createUrl(this.widgetPointer);
      this.lastClick = Date.now();
    },
    methods: {
      postRequest(pointer) {
        const bucket = this.config.datasets[this.dataset].bucket;
        let filepath = `${pointer}.png`;
        if (Object.hasOwn(this.config.datasets[this.dataset], 's3filepath')) {
          const s3filepath = this.config.datasets[this.dataset].s3filepath;
          const subRegExp = /(sub-.*?)_/;
          const sesRegExp = /_(ses-.*?)_/;
          const sesMatch = pointer.match(sesRegExp);
          const subMatch = pointer.match(subRegExp);
          let ses = '';
          let sub = '';
          if (sesMatch) {
            ses = pointer.match(sesRegExp)[1];
          }
          if (subMatch) {
            sub = pointer.match(subRegExp)[1];
          }
          filepath = s3filepath.replaceAll('{{SUBJECT}}', sub).replaceAll('{{SESSION}}', ses).replaceAll('{{FILENAME}}', pointer);
        }
        let s3cfg = '';
        if (Object.hasOwn(this.config.datasets[this.dataset], 's3cfg')) {
          s3cfg = this.config.datasets[this.dataset].s3cfg;
        }
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/Image', true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.onload = resolve;
          xhr.onerror = reject;
          xhr.send(JSON.stringify({
            filepath,
            bucket,
            s3cfg,
          }));
        });
      },
      /**
       * Creates the Signed URL for accessing brainswipes s3 bucket on MSI
       */
      async createUrl(pointer) {
        // getting the signed URL
        const url = await this.postRequest(pointer).then(data =>
          data.currentTarget.responseText,
        );
        // setting the url key based on the new url
        const urlKey = url.split('?')[0];
        // updating the data elements
        this.imgUrl = url;
        this.imgKey = urlKey;
      },
      imageError() {
        this.imgUrl = '/static/not-found.png';
      },
      /**
       * Show a tutorial step
       */
      showTutorialStep(stepNumber) {
        switch (stepNumber) {
          case 0:
            // highlight the pass button
            this.leftFocused = true;
            break;
          case 1:
            // highlight the fail button
            this.rightFocused = true;
            break;
          case 2:
            // highlight the help button
            this.helpFocused = true;
            break;
          default:
            break;
        }
      },
      /**
       * Fill a pattern by `this.widgetPointer` based on a delimiter.
       */
      fillPropertyPattern(pattern, delimiter) {
        // fill the pattern by splitting the widgetPointer by delimiter
        let output = pattern;
        const parts = String(this.widgetPointer).split(delimiter);
        _.map(parts, (p, i) => {
          output = output.replace(`{${i}}`, p);
        });
        return output;
      },
      /**
       * get the widget's new summary based on a user's response.
       * in this case its a running average.
       */
      getSummary(response) {
        // this widget will keep track of
        // the number of votes and the average vote
        if (!this.widgetSummary) {
          // the summary isn't initialized yet
          return {
            aveVote: response,
            count: 1,
          };
        }
        let newVote = ((this.widgetSummary.aveVote * this.widgetSummary.count) + response);
        newVote /= (this.widgetSummary.count + 1);
        const newWidgetSummary = Object.assign({}, this.widgetSummary);
        newWidgetSummary.aveVote = newVote;
        newWidgetSummary.count += 1;
        return newWidgetSummary;
      },
      /**
       * emit an annotation to the parent.
       */
      vote(val) {
        if (this.playMode === 'tutorial') {
          this.$emit('widgetRating', [val, this.identifier, this.tutorialStep]);
        } else {
          this.$emit('widgetRating', val);
        }
      },
      /**
       * set the swipe-left animation and vote 0
       */
      swipeLeft() {
        if ((Date.now() - this.lastClick) >= this.delay) {
          // set the transition style
          this.setSwipe('swipe-left');
          this.vote(0);
          this.lastClick = Date.now();
        }
      },
      /**
       * set the swipe-right animation and vote 1
       */
      swipeRight() {
        if ((Date.now() - this.lastClick) >= this.delay) {
          // set the transition style
          this.setSwipe('swipe-right');
          this.vote(1);
          this.lastClick = Date.now();
        }
      },
      /**
       * set the swipe direction based on the mouse/touch event.
       */
      onSwipe(evt) {
        if (evt.direction === 2) {
          this.swipeLeft();
        } else {
          this.swipeRight();
        }
      },
      /**
       * save the swipe direction variable.
       */
      setSwipe(sw) {
        this.swipe = sw;
      },
    },
    watch: {
      async widgetPointer() {
        await this.createUrl(this.widgetPointer);
      },
    },
  };
</script>

<style scoped>
  .imageSwipe {
    max-height: 532px;
    height: calc(100vw + 20px);
  }
  .user-card {
      max-width: 500px;
      height: fit-content;
      width: 100%;
      border: 1px solid #ccc;
      padding: 8px;
      box-shadow: 0px 2px 5px 0px #ccc;
      position: absolute;
      left: 0;
      right: 0;
      margin: auto;
      background-color: white;
  }
  .user-card__picture {
      width: 100%;
      display: block;
  }
  .image_area {
    background: black;
    position: relative;
    aspect-ratio : 1 / 1;
    overflow-y: hidden;
  }
  .loader {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9;
  }
  .user-card__name {
      margin-bottom: 0;
      margin-top: 8px;
  }
  .swipe-left {
      -webkit-animation: swipe-left 1s forwards;
              animation: swipe-left 1s forwards;
  }
  .swipe-right {
      -webkit-animation: swipe-right 1s forwards;
              animation: swipe-right 1s forwards;
  }
  @-webkit-keyframes swipe-left {
      to {
          -webkit-transform: rotate(-13deg) translate3d(-100%, 0, 0);
                  transform: rotate(-13deg) translate3d(-100%, 0, 0);
          opacity: 0;
      }
  }
  @keyframes swipe-left {
      to {
          -webkit-transform: rotate(-13deg) translate3d(-100%, 0, 0);
                  transform: rotate(-13deg) translate3d(-100%, 0, 0);
          opacity: 0;
      }
  }
  @-webkit-keyframes swipe-right {
      to {
          -webkit-transform: rotate(13deg) translate3d(100%, 0, 0);
                  transform: rotate(13deg) translate3d(100%, 0, 0);
          opacity: 0;
      }
  }
  @keyframes swipe-right {
      to {
          -webkit-transform: rotate(13deg) translate3d(100%, 0, 0);
                  transform: rotate(13deg) translate3d(100%, 0, 0);
          opacity: 0;
      }
  }
  /* Enter and leave animations can use different */
  /* durations and timing functions.              */
  /*.swipe-right-enter-active {
    transition: all .3s ease;
  }
  .swipe-right-enter-to {
    transition: all .3s ease;
  }*/
  .swipe-right-leave-active {
    transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
  }
  .swipe-right-leave-to
  /* .slide-fade-leave-active below version 2.1.8 */ {
    -webkit-transform: rotate(13deg) translate3d(100%, 0, 0);
            transform: rotate(13deg) translate3d(100%, 0, 0);
    opacity: 0;
  }
  /*.swipe-left-enter-active {
    transition: all .3s ease;
  }*/
  .swipe-left-leave-active {
    transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
  }
  .swipe-left-leave-to
  /* .slide-fade-leave-active below version 2.1.8 */ {
    -webkit-transform: rotate(-13deg) translate3d(-100%, 0, 0);
            transform: rotate(-13deg) translate3d(-100%, 0, 0);
    opacity: 0;
  }

  .focus {
    animation:pulse 0.5s infinite alternate;
  }


  @keyframes pulse {
    from { box-shadow:0px 0px 10px 0px #ffffff;}
    to { box-shadow:0px 0px 20px 5px #17a2b8;}
  }

  @media (min-width: 65em) {
    .zoom{
      max-width: 100% !important;;
      padding-bottom: 10vh;
      position: static;
    }
  }
</style>
