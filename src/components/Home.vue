<template>
  <div class="home container">
    <div class="jumbotron landing" :style="landingStyle">
      <div id="titles">
        <h1>BrainSwipes by DCAN</h1>
        <p class="lead mt-3">
          Choose a dataset to QC
        </p>
      </div>
      <p v-if="this.studies.length" class="buttons mt-3">
        <b-button v-for="study in studies" :key="study" class="btn btn-primary" v-show="datasetPrivileges[study]" @click="routeToPlay(study)">{{study}}</b-button>
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
    routerQuery: {
      type: Object,
    },
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
      type: Array,
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
      this.$emit('changeDataset', label);
      this.$router.push({ name: 'Play', params: { dataset: label }, query: this.routerQuery });
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
