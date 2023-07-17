<template name="tutorial">
  <div class="tutorial" ref="tutorial">
    <!-- Title -->
    <div>
      <h1>{{config.learn.tutorials[module].name}}</h1>
      <p class="lead">Scroll down to learn</p>
    </div>

    <!-- Progress Bar -->
    <div class="pbar pt-3 pb-3" v-if="currentBin.bin">
      <b-progress :value="scrollPosition" :max="1" show-progress class="ml-3 mr-3"></b-progress>
    </div>

    <!-- Table of Contents -->
    <div v-click-outside="hideTOC">
      <b-button type="button" class="btn btn-outline-primary btn-light" id="open-toc" @click="openTOC">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg></b-button>
      <div id="table-of-contents" v-show="showTOC">
        <b-button class="btn-swipes" @click="routeTo('TutorialSelect')">Back to Tutorial Selection</b-button>
        <hr>
        <h2>To Section</h2>
        <ul>
          <li v-for="section, sectionIndex in content" :key="sectionIndex" v-scroll-to="`#section${sectionIndex}`" @click="hideTOC">{{section.title}}</li>
        </ul>
      </div>
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
        <hr>
        <h1>Neuroimaging Terms</h1>
        <ul>
          <li v-for="term in Object.keys(glossary['Neuroimaging Terms']).sort()" :key="term"><strong>{{term}}</strong><p>{{glossary['Neuroimaging Terms'][term]}}</p></li>
        </ul>
      </div>
    </b-modal>
    <div class="tutorial-steps">
      <div v-for="(section, sectionIndex) in content" :key="`section${sectionIndex}`">
        <h1 :id="`section${sectionIndex}`">{{section.title}}</h1>
        <div v-for="(step, stepIndex) in content[sectionIndex].steps" :key="`step${stepIndex}`" :id="`section${sectionIndex}step${stepIndex}`" class="fullpage">
          <div v-if="step.text" class="tutorial-step">
            <p v-html="step.text"></p>
          </div>
          <div v-if="step.checks">
            <Checklist
              :config="config"
              :imageClass="Object.keys(step.checks)[0]"
              :checks="Object.values(step.checks)[0]"
            />
          </div>
          <div class="tutorial-tabs-wrapper" v-if="step.tabs">
            <div class="tutorial-tabs">
              <b-card>
                <b-tabs card pills fill>
                  <b-tab v-for="(tab, index) in step.tabs" :key="index" :title="tab.title" :active="!index">
                    <div class="checklist-wrapper" v-if="tab.checks">
                      <Checklist
                      :config="config"
                      :imageClass="Object.keys(tab.checks)[0]"
                      :checks="Object.values(tab.checks)[0]"
                      />
                    </div>
                    <img v-if="tab.image" :src="tab.image" class="mt-s pt-3 img"/>
                    <ImageStatic v-else-if="tab.sample"
                      :widgetPointer="tab.sample"
                      :dataset="tab.dataset"
                      :config="config"
                    />
                  </b-tab>
                </b-tabs>
              </b-card>
            </div>
          </div>
          <div v-if="step.image">
            <img :src="step.image" class="mt-3 pt-3 img"/>
          </div>
          <div v-if="step.sample">
            <ImageStatic
              :widgetPointer="step.sample"
              :dataset="step.dataset"
              :config="config"
            />
          </div>
          <div v-if="step.pointer" class="mt-3">
            <ImageSwipe
              :widgetPointer="step.pointer"
              :widgetSummary="widgetSummary"
              v-on:widgetRating="simulateSwipe"
              :playMode="'tutorial'"
              :tutorialStep="step.tutorialStep"
              ref="widget"
              :dataset="step.dataset"
              :identifier="`section${sectionIndex}step${stepIndex}`"
              :config="config"
            />
          </div>
        </div>
      </div>
      <b-button @click="tutorialComplete" class="mt-3 btn-swipes">Complete</b-button>
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

  .fullpage {
    margin-bottom: 10vh;
  }
  
  .fullpage hr {
    opacity: 0;
  }

  .widget {
    height: 100vh;
  }

  .message {
    position: absolute;
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
  }
  
  .tutorial-step{
    margin: 0 10vw;
  }

  dfn{
    font-weight: bold;
    cursor: help;
  }

  .tutorial-tabs-wrapper{
    margin-top: 5px;
    display: flex;
    justify-content: center;
  }

  .tutorial-tabs{
    width: 500px;
  }

  .tutorial {
    padding-bottom: 15vh;
  }

  @media (min-width: 65em) {

    #help {
      display: none;
    }

  }

</style>

<script>
/**
 * TODO: fill this in.
 */
  import _ from 'lodash';
  import Vue from 'vue';
  import ImageSwipe from './Widgets/ImageSwipe';
  import { glossary, glossaryKeys } from '../glossary';
  import Checklist from './Widgets/Checklist';
  import ImageStatic from './Widgets/ImageStatic';

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

  /* eslint-disable */
  // https://stackoverflow.com/a/42389266
  Vue.directive('click-outside', {
    bind: function (el, binding, vnode) {
      el.clickOutsideEvent = function (event) {
        // here I check that click was outside the el and its children
        if (!(el == event.target || el.contains(event.target))) {
          // and if it did, call method provided in attribute value
          vnode.context[binding.expression](event);
        }
      };
      document.body.addEventListener('click', el.clickOutsideEvent);
    },
    unbind: function (el) {
      document.body.removeEventListener('click', el.clickOutsideEvent);
    },
  });
  /* eslint-enable */

  export default {
    name: 'tutorial',
    components: {
      ImageSwipe,
      Checklist,
      ImageStatic,
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
         * Glossary of terms and linking keys
         */
        glossary,
        glossaryKeys,
        /**
         * variable that opens and closes the table of contents
         */
        showTOC: false,
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
      /**
       * prevents addDefinitions from running more than once
       */
      definitionsAdded: {
        type: Object,
        required: true,
      },
      /**
       * the tutorial module being viewed
       */
      module: {
        type: String,
        required: true,
      },
    },
    watch: {
    },
    computed: {
      /**
       * Tutorial content defined in config, with text and images to display.
       */
      content() {
        return this.config.learn.tutorials[this.module].content;
      },
      /**
       * The cutoffs of scrolling,
       * to help map scroll position to the step of the tutorial
       */
      bins() {
        let Nsteps = 0;
        this.content.forEach((section) => {
          Nsteps += section.steps.length;
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
    },
    methods: {
      /**
       * When this method is run, we tell the parent component that the
       * user has completed the tutorial.
       */
      tutorialComplete() {
        this.$emit('takenTutorial', this.module, 'complete');
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
      async addDefinitions() {
        if (!this.definitionsAdded[this.module]) {
          const terms = Object.keys(this.glossaryKeys);
          const termsRegex = new RegExp(`${terms.join('|')}`, 'gi');
          this.content.forEach((section) => {
            for (let index = 0; index < section.steps.length; index += 1) {
              if (Object.hasOwn(section.steps[index], 'text')) {
                const text = section.steps[index].text;
                const match = text.match(termsRegex);
                if (match) {
                  //eslint-disable-next-line
                  section.steps[index].text = this.replaceSubstring(match, text);
                }
              }
            }
          });
          this.$emit('markDefinitionsAdded', this.module);
        }
      },
      replaceSubstring(match, inputText) {
        let output = '';
        let text = inputText;
        do {
          const term = match.shift();
          const definition = this.glossary[this.glossaryKeys[term.toUpperCase()]
            .Category][[this.glossaryKeys[term.toUpperCase()].Term]];
          const regex = new RegExp(term, 'i');
          output += text.substr(0, text.indexOf(term) + term.length).replace(regex, `<dfn title="${definition}">${term}</dfn>`);
          text = text.substring(text.indexOf(term) + term.length);
        } while (match.length);
        output += text;
        return output;
      },
      hideTOC() {
        this.showTOC = false;
      },
      handleRouterQuery() {
        const query = this.$route.query;
        if (query.section) {
          let section = '';
          switch (query.section) {
            case 'atlasRegistration':
              section = 'header-Atl-Reg';
              break;
            case 'functionalRegistration':
              section = 'header-Func-Reg';
              break;
            default:
              section = 'header-Surf-Delin';
          }
          const element = document.getElementById(section);
          console.log(element);
          element.scrollIntoView();
        }
      },
      simulateSwipe(response) {
        const vote = response[0];
        const identifier = response[1];
        const answer = response[2];
        const direction = vote ? 'swipe-right' : 'swipe-left';
        const element = document.getElementById(identifier).getElementsByClassName('user-card')[0];
        if (answer === vote) {
          element.classList.add(direction);
          setTimeout(() => { this.removeClass(element, direction); }, 600);
        }
      },
      removeClass(element, className) {
        element.classList.remove(className);
      },
      routeTo(route) {
        this.$router.push({ name: route });
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
    async mounted() {
      await this.addDefinitions();
      this.handleRouterQuery();
    },
  };
</script>
