<template>
  <div class="home container">
    <b-alert :show="maintenanceStatus" variant="danger">BrainSwipes will be unavailable on {{maintenanceDate}} for scheduled maintenance.</b-alert>
    <div class="jumbotron landing" :style="landingStyle">
      <div id="titles">
        <h1>BrainSwipes by DCAN</h1>
        <p class="lead mt-3">
          {{Object.keys(userInfo).length ? userData.takenTutorial === 'complete' ? 'Choose a dataset to QC': 'Review our learning resources before you begin swiping' : 'Login to begin'}}
        </p>
      </div>
      <div v-if="Object.keys(studies).length" class="mt-3">
        <div v-if="userData.takenTutorial === 'complete'" class="buttons">
          <div v-for="study in Object.keys(studies)" :key="study">
            <b-button class="btn btn-primary" v-if="datasetPrivileges[study]" @click="routeToPlay(study)">{{study}}</b-button>
          </div>
        </div>
        <div v-else>
          <b-button class="btn btn-primary" @click="routeToTutorial">Learn</b-button>
        </div>
      </div>
    </div>
  </div>


</template>

<script>
/**
 * The landing page, on the route `/`. This component displays a title, tagline,
 * and background image splash page.
 */

export default {
  name: 'Home',
  props: {
    dataset: {
      type: String,
      required: true,
    },
    datasetPrivileges: {
      type: Object,
      required: true,
    },
    db: {
      type: Object,
      required: true,
    },
    studies: {
      type: Object,
      required: true,
    },
    globusToken: {
      type: String,
      required: true,
    },
    userInfo: {
      type: Object,
      required: true,
    },
    userData: {
      type: Object,
      required: true,
    },
    maintenanceDate: {
      type: String,
      required: true,
    },
    maintenanceStatus: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      landingStyle: { 'background-image': 'url("/static/UMN_logos2_PRINT-09.svg")' },
    };
  },
  methods: {
    routeToPlay(label) {
      const errors = [];
      if (!this.studies[label].available) {
        if (!this.globusToken) {
          errors.push(1);
        }
        if (!this.userInfo.emailVerified) {
          errors.push(5);
        }
      }
      if (errors.length) {
        this.$router.push({ name: 'Restricted', query: { errors } });
      } else {
        this.$emit('changeDataset', label);
        this.$router.push({ name: 'Play', params: { dataset: label } });
      }
    },
    routeToTutorial() {
      const name = this.userData.takenTutorial === 'none' ? 'Tutorial' : 'Practice';
      this.$router.push({ name });
    },
    reroute() {
      const query = this.$route.query;
      if (query.reroute) {
        this.$router.push({ path: query.reroute });
      }
    },
  },
  mounted() {
    this.reroute();
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

h1, h2 {
  font-weight: bold;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.home {
  text-align: left;
}

.home h1 {
  text-align: center;
}

.buttons {
  text-align: center;
  display: flex;
  justify-content: center;
}

.landing {
  background-color: white;
  background-repeat: no-repeat;
  background-position: center;
  height: 80vh;
  text-align: center;
}

.landing h1 {
  color: black;
  max-width: 350px;
  margin: auto;
}

.landing .lead {
  color: black;
  max-width: 250px;
  margin: auto;
}

.btn-primary {
  color: #fff;
  background-color: maroon;
  border-color: maroon;
  margin: 0.1em;
}

.jumbotron {
    padding: 2rem 1rem;
    margin-bottom: 0rem;
}

#titles {
  padding: 0.4rem;
  margin: 0 auto; 
  text-shadow: white 1px 1px, white 0 0 1px;
}

@media (max-width: 979px) {
  .jumbotron {
    background-size: 90%
  }
}
</style>
