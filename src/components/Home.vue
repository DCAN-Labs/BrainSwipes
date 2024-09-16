<template>
  <div class="home container">
    <div class="jumbotron landing" :style="landingStyle">
      <div id="titles">
        <p class="lead mt-3">
          {{Object.keys(userInfo).length ? needsTutorial ? 'Review our learning resources before you begin swiping' : 'Choose a dataset to QC' : 'Login to begin'}}
        </p>
        <div v-if="!needsTutorial" class="information-wrapper">
          <div class="inner-information-wrapper">
            <p class="explain-private">Private Studies</p>
            <div class="information" @mouseover="explainPrivate = true" @mouseleave="explainPrivate = false"></div>
          </div>
        </div>
      </div>
      <div v-if="Object.keys(userInfo).length">
        <div v-if="Object.keys(config.studies).length" class="mt-3">
          <div v-if="!needsTutorial">
            <div class="explain-wrapper">
              <span v-show="explainPrivate" class="explain">
                <p>Patient health information is sensitive. Some studies have stricter legal limitations because of this.</p>
                <p>Select grayed-out studies to learn more.</p>
              </span>
            </div>
            <DatasetSelect
              :globusToken="globusToken"
              :getGlobusIdentities="getGlobusIdentities"
              :config="config"
              :datasetPrivileges="datasetPrivileges"
              :surpressArchived="true"
              :showUnavailable="true"
              :useGlobus="true"
              :userInfo="userInfo"
              redirectPath=""
              redirectComponent="Home"
              @globusLogin="globusLogin"
              @activateDataset="routeToPlay"
              @activateStudy="chooseStudy"
            />
          </div>
          <div v-else>
            <b-button class="btn-swipes" to="/tutorial/basic">Learn</b-button>
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
import DatasetSelect from './Widgets/DatasetSelect';

export default {
  name: 'Home',
  data() {
    return {
      landingStyle: { 'background-image': 'url("/static/DCAN-logo-no-text-yellow.svg")' },
      /**
       * whether to show the tooltip explaining private datasets
       */
      explainPrivate: false,
      /**
       * which study to show datasets for
       */
      selectedStudy: '',
    };
  },
  props: {
    dataset: {
      type: String,
      required: true,
    },
    /**
     * the studies the user is allowed to see
     */
    datasetPrivileges: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    /**
     * the initialized firebase database
     */
    db: {
      type: Object,
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
    userInfo: {
      type: Object,
      required: true,
    },
    userData: {
      type: Object,
      required: true,
    },
    /**
     * the configuration from firebase
     */
    config: {
      type: Object,
      required: true,
    },
  },
  components: {
    DatasetSelect,
  },
  methods: {
    routeToPlay(study, dataset) {
      if (this.config.datasets[dataset].archived) {
        this.$router.push({ name: 'Promo', params: { study } });
      } else if (this.datasetPrivileges[study]) {
        const errors = [];
        if (!this.config.studies[study].available) {
          if (!this.globusToken) {
            errors.push('noIdentites');
          }
        }
        if (errors.length) {
          this.$router.push({ name: 'Restricted', query: { errors } });
        } else {
          this.$emit('changeDataset', dataset, study);
          this.$router.push({ name: 'Play', params: { study, dataset } });
        }
      } else {
        this.$router.push({ name: 'Promo', params: { study } });
      }
    },
    reroute() {
      const query = this.$route.query;
      if (query.reroute) {
        this.$router.push({ path: query.reroute });
      }
    },
    globusLogin(accessToken) {
      this.$emit('globusLogin', accessToken);
    },
    chooseStudy(study) {
      if (!this.datasetPrivileges[study]) {
        this.$router.push({ name: 'Promo', params: { study } });
      }
    },
  },
  mounted() {
    this.reroute();
    console.log('datasetPrivileges:', this.datasetPrivileges);
  },
  computed: {
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
      if (this.datasetPrivileges.TEST) {
        restricted.push('TEST');
      }
      return { open, restricted };
    },
    needsTutorial() {
      let needsTutorial = true;
      if (Object.hasOwn(this.userData, 'tutorials')) {
        if (Object.hasOwn(this.userData.tutorials, 'basic')) {
          needsTutorial = this.userData.tutorials.basic === 'none';
        }
      }
      return needsTutorial;
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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

.jumbotron {
    padding: 2rem 1rem;
    margin-bottom: 0rem;
}

#titles {
  padding: 0.4rem;
  margin: 0 auto; 
}

.explain-wrapper {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
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
.explain-private {
  font-size: 0.9em;
  font-weight: bold;
}

@media (max-width: 979px) {
  .jumbotron {
    background-size: 90%
  }
}
.buttons img {
  color: white;
}
</style>
