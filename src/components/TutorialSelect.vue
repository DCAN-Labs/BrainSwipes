<template>
  <div id=tutorial-select>
    <h1>Complete more tutorials to access more datasets!</h1>
    <div class="card-wrapper">
      <div v-for="tutorial in Object.keys(config.learn.tutorials)" :key="tutorial">
        <b-card
          :title="config.learn.tutorials[tutorial].name"
          :img-src="config.learn.tutorials[tutorial].image"
          img-alt="Image"
          img-top
          tag="article"
          style="max-width: 20rem;"
          class="mb-2"
        >
          <div v-if="userData.tutorials[tutorial] === 'complete'" class="check-wrapper">
            <div class="checked"></div>
          </div>
          <b-card-text v-else>
            <p>{{config.learn.tutorials[tutorial].about}}</p>
            <h3>Required for:</h3>
            <p v-for="dataset in requiredFor[tutorial]" :key="dataset">{{config.datasets[dataset].name}}</p>
          </b-card-text>
          <b-button @click="routeToTutorial(tutorial)" class="btn-swipes">View Tutorial</b-button>
        </b-card>
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
    },
    computed: {
      requiredFor() {
        const requiredFor = {};
        Object.keys(this.config.datasets).forEach((dataset) => {
          if (!dataset.includes('TEST')) {
            if (Object.hasOwn(this.config.datasets[dataset], 'tutorials')) {
              Object.keys(this.config.datasets[dataset].tutorials).forEach((tutorial) => {
                if (Object.hasOwn(requiredFor, tutorial)) {
                  requiredFor[tutorial].push(dataset);
                } else {
                  requiredFor[tutorial] = [dataset];
                }
              });
            }
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
</style>