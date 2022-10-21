<template>
  <div class="home container">
    <b-alert :show="bannerStatus" variant="danger">BrainSwipes will be unavailable on {{config.maintenance.date}} for scheduled maintenance.</b-alert>
    <div class="jumbotron landing" :style="landingStyle">
      <div id="titles">
        <h1>BrainSwipes by DCAN</h1>
        <p class="lead mt-3">
          {{Object.keys(userInfo).length ? userData.takenTutorial === 'complete' ? 'Choose a dataset to QC': 'Review our learning resources before you begin swiping' : 'Login to begin'}}
        </p>
      </div>
      <div v-if="Object.keys(userInfo).length">
        <div v-if="Object.keys(config.studies).length" class="mt-3">
          <div v-if="userData.takenTutorial === 'complete'">
            <div class="information-wrapper">
              <div class="inner-information-wrapper stand-out">
                <h2>Public Datasets</h2>
                <div class="information" @mouseover="explainPublic = true" @mouseleave="explainPublic = false"></div>
              </div>
            </div>
            <div class="explain-wrapper">
              <span v-show="explainPublic" class="explain">Anyone can swipe these datasets! Visit the about page to learn more.</span>
            </div>
            <div class="buttons">
              <div v-for="study in categorizedDatasets.open" :key="study">
                <b-button class="btn btn-primary" @click="routeToPlay(study)">{{study}}</b-button>
              </div>
            </div>
            <hr class="seperator">
            <div class="information-wrapper">
              <div class="inner-information-wrapper stand-out">
                <h2>Private Datasets</h2>
                <div class="information" @mouseover="explainPrivate = true" @mouseleave="explainPrivate = false"></div>
              </div>
            </div>
            <div class="explain-wrapper">
              <span v-show="explainPrivate" class="explain">
                <p>Patient health information is sensitive! Some datasets have stricter legal limitations because of this.</p>
                <p>Select a dataset to learn more.</p>
              </span>
            </div>
            <div class="buttons">
              <div v-for="study in categorizedDatasets.restricted" :key="study">
                <b-button class="btn" :class="datasetPrivileges[study] ? 'btn-primary' : 'btn-unavailable'" @click="routeToPlay(study)">{{study}}</b-button>
              </div>
            </div>
          </div>
          <div v-else>
            <b-button class="btn btn-primary" @click="routeToTutorial">Learn</b-button>
          </div>
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
    config: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      landingStyle: { 'background-image': 'url("/static/UMN_logos2_PRINT-09.svg")' },
      explainPrivate: false,
      explainPublic: false,
    };
  },
  methods: {
    routeToPlay(label) {
      if (this.datasetPrivileges[label]) {
        const errors = [];
        if (!this.config.studies[label].available) {
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
      } else {
        this.$router.push({ name: 'Promo', params: { dataset: label } });
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
  computed: {
    bannerStatus() {
      return this.config.maintenance.bannerStatus;
    },
    categorizedDatasets() {
      const open = [];
      const restricted = [];
      Object.keys(this.config.studies).forEach((study) => {
        if (this.config.studies[study].available) {
          open.push(study);
        } else if (study !== 'TEST') {
          restricted.push(study);
        }
      });
      if (this.datasetPrivileges['TEST']) {
        restricted.push('TEST');
      }
      return { open, restricted };
    },
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

.btn-unavailable {
  color: #fff;
  background-color: grey;
  border-color: grey;
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

.seperator {
  max-width: 500px;
}

.stand-out {
  background-color: white;
  border-width: thin;
  border-radius: 8px;
  border-style: outset;
  padding: 8px;
  font-size: 1.3em;
  margin-bottom: 3px;
  font-weight: bold;
}

.explain-wrapper {
  display: flex;
  justify-content: center;
}

.explain {
  max-width: 95vw;
  width: 400px;
  background-color: #080808;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
}

@media (max-width: 979px) {
  .jumbotron {
    background-size: 90%
  }
}
</style>
