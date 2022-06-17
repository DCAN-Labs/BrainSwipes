<template name="tutorial">
  <div class="tutorial" ref="tutorial">
    <!-- Title -->
    <div>
      <h1>Tutorial</h1>
      <p class="lead">Scroll down to learn how to play</p>
    </div>

    <!-- Progress Bar -->
    <div class="pbar pt-3 pb-3" v-if="currentBin.bin">
      <b-progress :value="scrollPosition" :max="1" show-progress class="ml-3 mr-3"></b-progress>
    </div>

    <!-- Table of Contents -->
    <b-button type="button" class="btn btn-outline-primary btn-light" id="open-toc" @click="openTOC">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg></b-button>
    <div id="table-of-contents" v-show="showTOC">
      <ul>
        <li v-scroll-to="'#mri-intro'">MRI Introduction</li>
        <li v-scroll-to="'#qa-image-types'">QA Image Types</li>
        <li v-scroll-to="'#structural-qa'">How to perform structural QA</li>
        <li v-scroll-to="'#functional-qa'">How to perform functional QA</li>
        <li v-scroll-to="'#using-swipes'">Using the BrainSwipes interface</li>
      </ul>
    </div>

    <b-button id="help" class="btn btn-outline-primary btn-light" @click="openGlossary">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-question-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/></svg>    
    </b-button>

    <!-- Glossary -->
    <b-modal id="glossary" :title="'Glossary of Terms'"
      ref="glossary" size="lg">
      <div>
        <h1>Brain Anatomy</h1>
        <ul>
          <li v-for="term in Object.keys(glossary['Brain Anatomy']).sort()" :key="term"><strong>{{term}}</strong><p>{{glossary['Brain Anatomy'][term]}}</p></li>
        </ul>
        <h1>Imaging Terms</h1>
        <ul>
          <li v-for="term in Object.keys(glossary['Imaging Terms']).sort()" :key="term"><strong>{{term}}</strong><p>{{glossary['Imaging Terms'][term]}}</p></li>
        </ul>
      </div>
    </b-modal>
    <div class="tutorial-steps">
      <!-- Introduction steps -->
      <h1 id="mri-intro">MRI Introduction</h1>
      <div v-for="(step, index) in steps.MRIintro" class="fullpage">
        <div class="tutorial-step" :id="'MRIintro'+index">

          <p v-html="step.text"></p>

        </div>
        <img :src="step.image" class="mt-3 pt-3 img"/>
      </div>
      <h1 id="qa-image-types">QA Image Types</h1>
      <div v-for="(step, index) in steps.QAimagetypes" class="fullpage">
        <div class="tutorial-step" :id="'QAimagetypes'+index">

          <p v-html="step.text"></p>

        </div>
        <img :src="step.image" class="mt-3 pt-3 img"/>
      </div>
      <h1 id="structural-qa">How to perform structural QA</h1>
      <div v-for="(step, index) in steps.structuralQA" class="fullpage">
        <div class="tutorial-step" :id="'structuralQA'+index">

          <p v-html="step.text"></p>

        </div>
        <img :src="step.image" class="mt-3 pt-3 img"/>
      </div>
      <h1 id="functional-qa">How to perform functional QA</h1>
      <div v-for="(step, index) in steps.functionalQA" class="fullpage">
        <div class="tutorial-step" :id="'functonalQA'+index">

          <p v-html="step.text"></p>

        </div>
        <img :src="step.image" class="mt-3 pt-3 img"/>
      </div>

      <!-- Example Steps -->
      <h1 id="using-swipes">Using the BrainSwipes interface</h1>
      <div v-for="(step, index) in steps.examples" class="fullpage">
        <div class="text-center message w-100" :id="'example'+index">
          <p v-html="step.text"></p>

          <div v-if="step.pointer" class="mt-3">
            <WidgetSelector
            :widgetPointer="step.pointer"
            :widgetSummary="widgetSummary"
            :playMode="'tutorial'"
            :tutorialStep="step.tutorialStep"
            ref="widget"
            :dataset="tutorialDataset"
            :bucket="tutorialBucket"
            />
          </div>
          <div v-if="step.tutorialCompleted">
            <b-button @click="tutorialComplete" class="mt-3">Play now</b-button>
          </div>
        </div>
      </div>
    </div>
    <div class="arrow" v-if="bins.length-1 != currentBin.bin" v-scroll-to="nextStep">
      <Arrow />
    </div>

    <p>
    </p>
  </div>
</template>

<style>

  .img {
    max-height: 80vh;
    width: 100%;
    max-width: 500px;
  }

  .fullpage {
    height: 100vh;
  }

  .message {
    position: absolute;
  }

  .invisible {
    opacity: 0;
    white-space: pre-wrap;
  }

  .pbar {
    position: -webkit-sticky; /* Safari */
    position: sticky;
    background: white;
    top: 0;
    z-index: 2;
  }

  #glossary {
    position: fixed;
    top: 5vh;
    font-family: Nunito, Helvetica, Arial, sans-serif;
  }

  #glossary li{
    margin-left: 15px;
  }

  #glossary strong{
    font-weight: bold;
  }

  #glossary p{
    margin-left: 15px;
  }

  #help {
    position: fixed;
    top: 5vh;
    right: 5vw;
    z-index: 5;
  }

  #open-toc {
    position: fixed;
    top: 5vh;
    left: 0;
    z-index: 5;
  }

  #table-of-contents {
    position: fixed;
    top: 10vh;
    left: 0;
    z-index: 6;
    outline: 1px solid black;
    padding: 0.5em 1em 1em 1em;
    background-color: white;
  }

  #table-of-contents li{
    margin-top: 0.5em;
    cursor: pointer;
  }

  .tutorial-steps h1{
    padding-top: 50px;
    margin-bottom: 15px;
    font-size: 2em;
  }

  .tutorial-step{
    margin: 0 10vw;
  }

  .arrow{
    display: block;
  }

  dfn{
    font-weight: bold;
    cursor: help;
  }

  @media (min-width: 65em) {
    .arrow {
      display: none;
    }
  }

</style>

<script>
/**
 * TODO: fill this in.
 */
  import { VueTyper } from 'vue-typer';
  import _ from 'lodash';
  import Vue from 'vue';
  import Arrow from './Animations/ArrowDown';
  import WidgetSelector from './WidgetSelector';
  import glossary from '../glossary';

  const VueScrollTo = require('vue-scrollto');

  // You can also pass in the default options
  Vue.use(VueScrollTo, {
    container: 'body',
    duration: 500,
    easing: 'ease',
    offset: -75,
    force: true,
    cancelable: true,
    onStart: false,
    onDone: false,
    onCancel: false,
    x: false,
    y: true,
  });

  export default {
    name: 'tutorial',
    components: {
      'vue-typer': VueTyper,
      Arrow,
      WidgetSelector,
    },
    data() {
      return {
        /**
        * The current scroll position
        */
        scrollPosition: 0,
        /**
        * The sample IDs summary (not implemented yet)
        */
        widgetSummary: {}, // TODO: fill this properly
        /**
         * Glossary of terms
         */
        glossary,
        /**
         * variable that opens and closes the table of contents
         */
        showTOC: false,
      };
    },
    props: {
      /**
       * the various levels, the points need to reach the levels,
       * and the badges (colored and greyed out) to display
       */
      levels: {
        type: Object,
        required: true,
      },
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
    },
    watch: {
    },
    computed: {
      /**
       * The steps defined in config, with text and images to display.
       */
      steps() {
        return this.config.tutorial.steps;
      },
      /**
       * The type of background animation to show.
       */
      backgroundAnimation() {
        return this.config.tutorial.customBackgroundAnimation;
      },
      /**
       * The cutoffs of scrolling,
       * to help map scroll position to the step of the tutorial
       */
      bins() {
        let Nsteps = 0;
        Object.keys(this.steps).forEach((key) => {
          Nsteps += this.steps[key].length;
        });
        const binSize = 1 / Nsteps;
        const bins = [];
        for (let i = 0; i < Nsteps; i += 1) {
          bins.push({ bin: i, from: i * binSize, to: (i + 1) * binSize });
        }
        return bins;
      },
      /**
       * The current bin based on scroll position.
       */
      currentBin() {
        const cBin = _.filter(this.bins,
          b => this.scrollPosition <= b.to && this.scrollPosition > b.from);
        if (cBin.length) {
          return cBin[0];
        }

        return { bin: 0 };
      },
      /**
       * The next step that should be displayed.
       */
      nextStep() {
        if (this.currentBin.bin < this.steps.MRIintro.length - 1) {
          return `#MRIintro${this.currentBin.bin + 1}`;
        } else if (this.currentBin.bin <
          (this.steps.QAimagetypes.length + this.steps.MRIintro.length) - 1) {
          return `#QAimagetypes${(this.currentBin.bin - this.steps.MRIintro.length) + 1}`;
        } else if (this.currentBin.bin < (
          this.steps.QAimagetypes.length + this.steps.MRIintro.length +
          this.steps.structuralQA.length) - 1) {
          return `#structuralQA${(this.currentBin.bin - this.steps.QAimagetypes.length - this.steps.MRIintro.length) + 1}`;
        } else if (this.currentBin.bin < (
          this.steps.QAimagetypes.length + this.steps.MRIintro.length +
          this.steps.structuralQA.length + this.steps.functionalQA.length) - 1) {
          return `#functonalQA${(this.currentBin.bin - this.steps.QAimagetypes.length - this.steps.MRIintro.length - this.steps.structuralQA.length) + 1}`;
        }
        return `#example${(this.currentBin.bin - this.steps.QAimagetypes.length - this.steps.MRIintro.length - this.steps.structuralQA.length - this.steps.functionalQA.length) + 1}`;
      },
      /**
       * dataset that the tutorial images are from
       */
      tutorialDataset() {
        return this.config.tutorial.dataset;
      },
      /**
       * s3 bucket where the tutorial images are held
       */
      tutorialBucket() {
        return this.config.tutorial.bucket;
      },
    },
    methods: {
      /**
       * When this method is run, we tell the parent component that the
       * user has completed the tutorial.
       */
      tutorialComplete() {
        this.$emit('taken_tutorial', true);
      },
      /**
       * Keep track of the scroll position and save it to the scrollPosition variable.
       */
      handleScroll() {
        const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const scrollPosition = (window.scrollY - 60) / (this.$refs.tutorial.clientHeight - h);
        if (scrollPosition < 0) {
          this.scrollPosition = 0;
        } else if (scrollPosition > 1) {
          this.scrollPosition = 1;
        } else {
          this.scrollPosition = scrollPosition;
        }
      },
      openGlossary() {
        this.$refs.glossary.show();
      },
      openTOC() {
        this.showTOC = !this.showTOC;
      },
      addDefinitions() {
        Object.keys(this.glossary).forEach((category) => {
          const terms = Object.keys(this.glossary[category]);
          Object.keys(this.steps).forEach((section) => {
            Object.keys(section).forEach((step) => {
              if (Object.hasOwnProperty.call(this.steps[section], step)) {
                terms.forEach((term) => {
                  const match = this.steps[section][step].text.toString().toUpperCase().match(term.toString().toUpperCase());
                  if (match) {
                    const regex = new RegExp(term, 'gi');
                    const result = this.steps[section][step].text.toString().replace(regex, `<dfn title="${this.glossary[category][term]}">${term}</dfn>`);
                    this.steps[section][step].text = result;
                  }
                });
              }
            });
          });
        });
      },
    },
    /**
     * Add a scroll listener when the component is created.
     */
    created() {
      window.addEventListener('scroll', this.handleScroll);
    },
    /**
     * Remove the scroll listener when the component is destroyed.
     */
    destroyed() {
      window.removeEventListener('scroll', this.handleScroll);
    },
    mounted() {
      this.addDefinitions();
    },
  };
</script>
