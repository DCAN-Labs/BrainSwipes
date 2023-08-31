<template>
  <div id="about">

    <b-container class="about">
      <h1> Who are we? </h1>
        <p>
          Brainswipes.us is run by the Developmental Cognition and Neuroimaging (DCAN) lab. Our work focuses on advancing the understanding of brain development in health and disease.
        </p>
        <p>
          We specialize in using a type of neuroimaging called resting state functional connectivity magnetic resonance imaging to study the brain across development (from infancy to aging), in different disorders (ADHD, autism, Parkinson’s Disease), and across different species (humans, non-human primates and rodents). We combine this technique with multiple other neuroimaging, behavioral and biological measures.
        </p>
      <h1> Why do we need this app? </h1>
        <p>
          Our research involves using large-scale neuroimaging datasets. We want to be sure that the data that we use and share with the broader community has undergone effective quality control. BrainSwipes leverages crowdsourcing to review and rate large amounts of data quickly, making our results more replicable and reliable. 
        </p>
      <h1> Origin of Swipes For Science </h1>
        <p>
          SwipesForScience is an open source project that is easy to create and customizable to any dataset. Visit the <a href="https://swipesforscience.org/" target="_blank">SwipesForScience website</a> to learn more.
        </p>
      <h1>Contact Us</h1>
        <p>If you have any questions please contact us at <a href="mailto:dcanlab@umn.edu?subject=BrainSwipes" target="_blank">dcanlab@umn.edu</a>!</p>
        <p>Found a bug or other issue with the app? Post a <a href="https://github.com/DCAN-Labs/BrainSwipes/issues/new" target="_blank">GitHub issue.</a></p>
      <h1>Accessing Closed Studies</h1>
        <p>
          Some studies are not open to the public. In order to access these you must sign the appropriate data use aggreement with the governing body for that study. If you believe you should have access to a study, fill out an access request form by following the link in your profile. BrainSwipes uses Globus authentication to authenticate users for these studies. See the <a href="https://docs.globus.org/how-to/get-started/" target="_blank">Globus documentation</a> on how to add an identity to your Globus account.
        </p>
    </b-container>
    <h1>Current Studies</h1>
      <p>Choose a study to learn about</p>
      <div class="about-buttons">
        <div v-for="study in filteredDatasets" :key="study">
          <b-button class="btn-swipes" @click="routeToPromo(study)">{{study}}</b-button>
        </div>
      </div>
  </div>

</template>

<style scoped>

#about {
  min-height: 100vh;
  padding-bottom: 15vh;
}

.about p {
  text-align: justify;
  padding-top: 0.5em;
  padding-bottom: 1.5em;
}

.about-buttons {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

</style>

<script>
/**
 * This is the about page for the route /about.
 */
export default {
  name: 'about',
  data() {
    return {
    };
  },
  props: {
    config: {
      type: Object,
      required: true,
    },
  },
  methods: {
    routeToPromo(study) {
      this.$router.push({ name: 'Promo', params: { study } });
    },
  },
  computed: {
    filteredDatasets() {
      return Object.keys(this.config.studies).filter(study => study !== 'TEST');
    },
  },
};
</script>
