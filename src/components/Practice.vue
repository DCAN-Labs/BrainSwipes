<template name="practice">
  <div id="practice" class="container">
    <!-- Title -->
    <div>
      <h1>{{config.learn.tutorials[module].name}}</h1>
      <p class="lead">Test your knowledge on these practice images!</p>
      <hr>
    </div>

    <!-- Progress Bar -->
    <div class="pbar pt-3 pb-3">
      <b-progress :value="progress" :max="Object.keys(steps).length - 1" show-progress class="ml-3 mr-3"></b-progress>
    </div>

    <div id="practice-sample" v-if="!swiped" :class="'fade-in'">
      <ImageSwipe
        :widgetPointer="steps[progress].pointer"
        v-on:widgetRating="simulateSwipe"
        :playMode="'tutorial'"
        :identifier="`practice${progress}`"
        :tutorialStep="null"
        ref="widget"
        :dataset="steps[progress].dataset"
        :config="config"
      />
    </div>

    <div id="practice-feedback" v-show="swiped" :class="'fade-in'">
      <div class="feedback-body">
        <div v-if="!steps[progress].finished">
          <h2> You responded {{userResponse ? 'Pass' : 'Fail'}} </h2>
          <h2> This image should be {{steps[progress].answer ? 'Passed' : 'Failed'}} </h2>
          <hr>
          <h3>{{getImageType(steps[progress].pointer)[1]}}</h3>
          <Checklist v-if="steps[progress].checks"
            :config="config"
            :imageClass="getImageType(steps[progress].pointer)[0]"
            :checks="steps[progress].checks"
          />
        </div>
        <br>
        <p v-html="steps[progress].text"></p>
      </div>
      <div class="fade-in" v-show="buttonDelay <= 0">
        <div v-if="progress < Object.keys(steps).length -1">
          <b-button @click="previousSample">Revisit This Image</b-button>
          <b-button @click="nextSample" :disabled="userResponse !== steps[progress].answer">Next Sample</b-button>
        </div>
        <div v-else>
          <b-button @click="tutorialComplete">Start Swiping!</b-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>

  .img {
    max-height: 80vh;
    width: 100%;
    max-width: 500px;
    margin-bottom: 35px;
  }

  .pbar {
    position: -webkit-sticky; /* Safari */
    position: sticky;
    background: white;
    top: 0;
    z-index: 2;
  }

  .fade-in{
    animation: fadeIn 2s;
  }

  .feedback-body {
    min-height: 400px;
  }

  #practice-sample {
    padding-bottom: 15vh;
  }

  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

</style>

<script>
/**
 * TODO: fill this in.
 */
  import ImageSwipe from './Widgets/ImageSwipe';
  import Checklist from './Widgets/Checklist';

  /* eslint-enable */

  export default {
    name: 'practice',
    components: {
      ImageSwipe,
      Checklist,
    },
    data() {
      return {
        /**
        * The index that tracks progress
        */
        progress: 0,
        /**
         * whether to show the widget (false) or feedback (true)
         */
        swiped: false,
        /**
         * What the user responded to the last sample
         */
        userResponse: 0,
        /**
         * Used to set a timer for delaying button appearance
         */
        buttonDelay: 0,
        /**
         * How many seconds the buttons stay hidden
         */
        defaultButtonDelay: 2,
      };
    },
    props: {
      /**
       * The config object that is loaded from firebase
       */
      config: {
        type: Object,
        required: true,
      },
      module: {
        type: String,
        required: true,
      },
    },
    computed: {
      /**
       * The steps defined in config, with text and images to display.
       */
      steps() {
        return this.config.learn.tutorials[this.module].steps;
      },
      /**
       * dataset that the tutorial images are from
       */
      tutorialDataset() {
        return this.config.learn.tutorial.dataset;
      },
    },
    methods: {
      /**
       * When this method is run, we tell the parent component that the
       * user has completed the tutorial.
       */
      tutorialComplete() {
        this.$emit('takenTutorial', this.module, 'complete');
      },
      simulateSwipe(response) {
        const vote = response[0];
        this.userResponse = vote;
        // const identifier = response[1];
        // const answer = response[2];
        const direction = vote ? 'swipe-right' : 'swipe-left';
        const element = document.getElementById('practice-sample').getElementsByClassName('user-card')[0];
        element.classList.add(direction);
        setTimeout(() => { this.removeClass(element, direction); }, 600);
      },
      removeClass(element, className) {
        element.classList.remove(className);
        this.swiped = !this.swiped;
        this.buttonDelay = this.defaultButtonDelay;
      },
      nextSample() {
        this.progress += 1;
        this.swiped = this.progress >= Object.keys(this.steps).length - 1 ?
          this.swiped : !this.swiped;
      },
      previousSample() {
        this.swiped = !this.swiped;
      },
      getImageType(pointer) {
        let imageType = 'other';
        if (Object.hasOwn(this.config.learn.tutorials[this.module], 'imageType')) {
          imageType = this.config.learn.tutorials[this.module].imageType;
        } else if (pointer.match(/atlas/i)) {
          imageType = 'atlas';
        } else if (pointer.match(/task/i)) {
          imageType = 'func';
        } else {
          imageType = 'anat';
        }
        const imageTitle = this.config.imageTypes[imageType];
        return [imageType, imageTitle];
      },
    },
    watch: {
      buttonDelay: {
        handler(value) {
          if (value > 0) {
            setTimeout(() => {
              this.buttonDelay -= 1;
            }, 1000);
          }
        },
        immediate: true,
      },
    },
  };
</script>
