<template>
  <div id=tutorial-select>
    <h1>Complete more tutorials to access more datasets!</h1>
    <h2>Tutorials</h2>
    <div class="center-flex">
      <div class="card-wrapper">
        <div class="accordion" role="tablist">
          <b-card no-body v-for="tutorial in orderedTutorials" :key="tutorial">
            <b-card-header header-tag="header" class="p-1" role="tab">
              <b-button block v-b-toggle="`accordion-${tutorial}`" class="btn-swipes">
                <span class="center-flex vertical-align-center">
                  <p class="header-text">{{config.learn.tutorials[tutorial].name}} </p>
                  <!-- <p> class="header-text">{{config.learn.tutorials[tutorial].name}} </p> -->
                  <div v-if="userData.tutorials[tutorial] === 'complete'" class="check-wrapper">
                    <div class="checked"></div>
                  </div>
                </span>
              </b-button>
            </b-card-header>
            <b-collapse :id="`accordion-${tutorial}`" accordion="my-accordion" role="tabpanel">
              <b-card-body>
                <b-card-text>
                  <p>{{config.learn.tutorials[tutorial].about}}</p>
                  <hr>
                  <h3>Required for:</h3>
                  <p v-for="dataset in requiredFor[tutorial]" :key="dataset"> {{config.datasets[dataset].name}} </p>
                  <hr>
                  <b-button v-if="!neededPrerequisites(tutorial).length" @click="routeTo('Tutorial', tutorial)" class="btn-swipes">View Tutorial</b-button>
                  <div v-else>
                    <h3>You must complete the prerequisites.</h3>
                    <p v-for="prereq in neededPrerequisites(tutorial)" :key="prereq">
                        {{config.learn.tutorials[prereq].name}}
                    </p>
                  </div>
                </b-card-text>
              </b-card-body>
            </b-collapse>
          </b-card>
        </div>
      </div>
    </div>
    <br>
    <h2>Interactive Practice</h2>
    <div class="center-flex">
      <div class="card-wrapper">
        <div class="accordion" role="tablist">
          <b-card no-body v-for="tutorial in practices" :key="tutorial">
            <b-card-header header-tag="header" class="p-1" role="tab">
              <b-button block v-b-toggle="`accordion-${tutorial}`" class="btn-swipes">
                <span class="center-flex vertical-align-center">
                  <p class="header-text">{{config.learn.tutorials[tutorial].name}} <p>
                  <div v-if="userData.tutorials[tutorial] === 'complete'" class="check-wrapper">
                    <div class="checked"></div>
                  </div>
                </span>
              </b-button>
            </b-card-header>
            <b-collapse :id="`accordion-${tutorial}`" accordion="my-accordion" role="tabpanel">
              <b-card-body>
                <b-card-text>
                  <p>{{config.learn.tutorials[tutorial].about}}</p>
                  <hr>
                  <h3>Required for:</h3>
                  <p v-for="dataset in requiredFor[tutorial]" :key="dataset"> {{config.datasets[dataset].name}} </p>
                  <hr>
                  <b-button v-if="!neededPrerequisites(tutorial).length" @click="routeTo('Practice', tutorial)" class="btn-swipes">View Practice</b-button>
                  <div v-else>
                    <h3>You must complete the prerequisites.</h3>
                    <p v-for="prereq in neededPrerequisites(tutorial)" :key="prereq">
                        {{config.learn.tutorials[prereq].name}}
                    </p>
                  </div>
                </b-card-text>
              </b-card-body>
            </b-collapse>
          </b-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'tutorial-select',
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
       * brainswipes configuration from firebase
       */
      config: {
        type: Object,
        required: true,
      },
    },
    methods: {
      routeTo(name, module) {
        this.$router.push({ name, params: { module } });
      },
      neededPrerequisites(tutorial) {
        const neededPrerequisites = [];
        if (Object.hasOwn(this.config.learn.tutorials[tutorial], 'prereq')) {
          Object.keys(this.config.learn.tutorials[tutorial].prereq).forEach((prereq) => {
            if (this.userData.tutorials[prereq] !== 'complete') {
              neededPrerequisites.push(prereq);
            }
          });
        }
        return neededPrerequisites;
      },
    },
    computed: {
      requiredFor() {
        const requiredFor = {};
        Object.keys(this.config.datasets).forEach((dataset) => {
          if (dataset.includes('TEST')) {
            return;
          } else if (Object.hasOwn(this.config.datasets[dataset], 'archived')) {
            if (this.config.datasets[dataset].archived) {
              return;
            }
          }
          if (Object.hasOwn(this.config.datasets[dataset], 'tutorials')) {
            Object.keys(this.config.datasets[dataset].tutorials).forEach((tutorial) => {
              if (Object.hasOwn(requiredFor, tutorial)) {
                requiredFor[tutorial].push(dataset);
              } else {
                requiredFor[tutorial] = [dataset];
              }
            });
          }
        });
        return requiredFor;
      },
      orderedTutorials() {
        let orderedTutorials = [];
        Object.keys(this.config.learn.tutorials).forEach((tutorial) => {
          let includeTutorial = true;
          if (Object.hasOwn(this.config.learn.tutorials[tutorial], 'inactive')) {
            if (this.config.learn.tutorials[tutorial].inactive) {
              includeTutorial = false;
            }
          }
          if (Object.hasOwn(this.config.learn.tutorials[tutorial], 'practice')) {
            if (this.config.learn.tutorials[tutorial].practice) {
              includeTutorial = false;
            }
          }
          if (includeTutorial) {
            orderedTutorials.push([tutorial, this.config.learn.tutorials[tutorial].order]);
          }
        });
        orderedTutorials = orderedTutorials.sort((a, b) => a[1] - b[1]);
        const sortedTutorials = [];
        orderedTutorials.forEach((tutorial) => {
          sortedTutorials.push(tutorial[0]);
        });
        return sortedTutorials;
      },
      practices() {
        const practices = [];
        Object.keys(this.config.learn.tutorials).forEach((tutorial) => {
          let includeTutorial = true;
          if (Object.hasOwn(this.config.learn.tutorials[tutorial], 'inactive')) {
            if (this.config.learn.tutorials[tutorial].inactive) {
              includeTutorial = false;
            }
          }
          if (Object.hasOwn(this.config.learn.tutorials[tutorial], 'practice')) {
            if (this.config.learn.tutorials[tutorial].practice) {
              if (includeTutorial) {
                practices.push(tutorial);
              }
            }
          }
        });
        return practices;
      },
    },
  };
</script>

<style scoped>
  #tutorial-select {
    padding-bottom: 15vh;
  }
  h4 {
    font-size: 1.6em;
    font-weight: bold;
    color: maroon;
  }
  .checked {
    content: ' ';
    background-image: url('../assets/check-square-white.svg');
    background-repeat: no-repeat;
    background-size: 28px 28px;
    height: 28px;
    width: 28px;
  }
  .card-wrapper {
    display: flex;
    flex-direction: column;
  }
  .check-wrapper {
    display: flex;
    justify-content: center;
    margin: 5px;
  }
  .card-body {
    width: 300px;
  }
  .card-header {
    width: 300px;
  }
  p {
    color: black;
  }
  strong {
    font-weight: bold;
  }
  .center-flex {
    display: flex;
    justify-content: center;
  }
  .vertical-align-center {
    align-items: center;
  }
  .header-text {
    color: whitesmoke;
  }
</style>