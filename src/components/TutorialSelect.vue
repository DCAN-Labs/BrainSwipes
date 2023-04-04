<template>
  <div id=tutorial-select>
    <h1>Complete more tutorials to access more datasets!</h1>
    <div class="card-wrapper">
      <div class="carousel-wrapper">
        <b-carousel
          controls
          indicators
          :interval="0"
          background="#ababab"
        >
          <b-carousel-slide v-for="tutorial in Object.keys(config.learn.tutorials)" :key="tutorial" :img-src="config.learn.tutorials[tutorial].image">
            <b-card
              :title="config.learn.tutorials[tutorial].name"
              tag="article"
              class="mb-2"
            >
              <div v-if="userData.tutorials[tutorial] === 'complete'" class="check-wrapper">
                <div class="checked"></div>
              </div>
              <b-card-text v-else>
                <p>{{config.learn.tutorials[tutorial].about}}</p>
                <h3>Required for:</h3>
                <p><span v-for="dataset in requiredFor[tutorial]" :key="dataset"><strong>|</strong> {{config.datasets[dataset].name}} <strong>|</strong></span></p>
              </b-card-text>
              <b-button v-if="completedPrerequisites(tutorial)" @click="routeToTutorial(tutorial)" class="btn-swipes">View Tutorial</b-button>
              <div v-else>
                <hr>
                <h3>You must complete the prerequisites.</h3>
                <p v-for="prereq in Object.keys(config.learn.tutorials[tutorial].prereq)" :key="prereq">
                    {{config.learn.tutorials[prereq].name}}
                </p>
              </div>
            </b-card>
          </b-carousel-slide>
        </b-carousel>
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
      routeToTutorial(tutorial) {
        console.log(tutorial);
      },
      completedPrerequisites(tutorial) {
        let completedPrerequisites = true;
        if (Object.hasOwn(this.config.learn.tutorials[tutorial], 'prereq')) {
          Object.keys(this.config.learn.tutorials[tutorial].prereq).forEach((prereq) => {
            if (this.userData.tutorials[tutorial][prereq] !== 'complete') {
              completedPrerequisites = false;
            }
          });
        }
        return completedPrerequisites;
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
    },
  };
</script>

<style scoped>
  h4 {
    font-size: 1.6em;
    font-weight: bold;
    color: maroon;
  }
  .checked {
    content: ' ';
    background-image: url('../assets/check-square.svg');
    background-repeat: no-repeat;
    background-size: 44px 44px;
    height: 44px;
    width: 44px;
  }
  .card-wrapper {
    display: flex;
    justify-content: center;
  }
  .check-wrapper {
    display: flex;
    justify-content: center;
    margin: 5px;
  }
  .carousel-wrapper{
    width: 500px;
    height: 220px;
  }
  .card-body {
    height: 250px;
    overflow-y: scroll;
  }
  p {
    color: black;
  }
  strong {
    font-weight: bold;
  }
</style>