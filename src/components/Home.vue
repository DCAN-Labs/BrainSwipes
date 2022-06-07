<template>
  <div class="home container">
    <b-alert :show="maintenanceStatus" variant="danger">BrainSwipes will be unavailable on {{maintenanceDate}} for scheduled maintenance.</b-alert>
    <div class="jumbotron landing" :style="landingStyle">
      <div id="titles">
        <h1>BrainSwipes by DCAN</h1>
        <p class="lead mt-3">
          Choose a dataset to QC
        </p>
      </div>
      <p v-if="Object.keys(studies).length" class="buttons mt-3">
        <b-button v-for="study in Object.keys(studies)" :key="study" class="btn btn-primary" v-show="datasetPrivileges[study]" @click="routeToPlay(study)">{{study}}</b-button>
      </p>
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
}

.landing {
  background-color: white;
  /* background-image: url('../assets/whaldrStatic.png'); */
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
  margin-right: .2em;
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

</style>
