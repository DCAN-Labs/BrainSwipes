<template>
  <div id="about">

    <b-container class="about">
      <h1> Origin of Swipes For Science </h1>
        <p>
          This application is built on the foundation of SwipesForScience, which is an open source project that provides a template for citizen science games. This tool makes it easy to create and customize the "game" to any dataset. Visit the <a href="https://swipesforscience.org/" target="_blank">SwipesForScience website</a> to learn more. 
        </p>
      <h1> Who are we? </h1>
        <p>
          Brainswipes.us is run by the Developmental Cognition and Neuroimaging (DCAN) lab. Our work focuses on advancing the understanding of brain development in health and disease.
        </p>
        <p>
          We specialize in using a type of neuroimaging called resting state functional magnetic resonance imaging (fMRI) to study the brain across development (from infancy to aging), in different disorders (ADHD, autism, Parkinson’s Disease), and across different species (humans, non-human primates and rodents). We combine this technique with multiple other neuroimaging, behavioral and biological measures.
        </p>
      <h1> Why do we need this app? </h1>
        <p>
          Our research involves using large-scale neuroimaging datasets. We want to be sure that the data that we use and share with the broader community has undergone effective quality control. BrainSwipes leverages crowdsourcing to review and rate large amounts of data quickly, making our results more replicable and reliable.
        </p>
      <h1> How does it work? </h1>
        <p>
          BrainSwipes brings Tinder's swipe paradigm to quality control. For each image, you will "swipe" right to fail an image or "swipe" left to pass an image. You can either use the buttons on the image or your arrow keys to rate an image. To get started, you'll need to complete the required tutorials first. Our goal for each dataset is to have every image swiped on at least 10 times in order to reach a consenus on the quality of the image. This means you will not be the one and only rater on an image, so try not to worry too hard about whether or not you are rating it "correctly". As long as you are following the guidelines in the tutorials, you are helping! 
        </p>
        <p>
          Once a dataset is QC'd, the experts will look at the ratings for each slice of each subject to determine if the subject should pass or fail as a whole. On a single image, we consider a score of above 0.7 a definite pass and a score of 0.3 a definite fail. Anything in between is questionable. Each subject has multiple images within the dataset which shows different views and slices of the same data. Since we are only looking at a single slice at a time, it can be hard to determine if the entire brain has issues or if this is just a weird transition slice that makes the data look worse than it is. All of the data will be considered when determining the quality of a subject. For example, there are generally 8 different anatomical images per subjects. If 1 image fails, while the rest of the images pass, then the subject as a whole would be considered a pass.  
        </p>
      <h1> Accessing Closed Studies </h1>
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
