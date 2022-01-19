<template>
  <div id="about">

    <b-container>
    <h1> Who are we? </h1>
      <p>
        Brainswipes.us is run by the Developmental Cognition and Neuroimaging (DCAN) lab. Our work focuses on advancing the understanding of brain development in health and disease.
      </p>
      <p>
        We specialize in using a type of neuroimaging called resting state functional connectivity magnetic resonance imaging to study the brain across development (from infancy to aging), in different disorders (ADHD, autism, Parkinson’s Disease), and across different species (humans, non-human primates and rodents). We combine this technique with multiple other neuroimaging, behavioral and biological measures.
      </p>
    <h1> Why do we need this app? </h1>
      <p>
        To use the often stated saying in introduction to statistics classes, “garbage in, garbage out.” Our research often involves using large-scale neuroimaging brain datasets. We want to be sure that the brain data that we use and share with the broader community has undergone effective quality control. BrainSwipes leverages crowdsourcing to review and rate large amounts of data quickly. This makes our results more replicable and reliable. 
      </p>
    <h1> Origin of Swipes For Science </h1>
      <p>
        The founders of the SwipesForScience game template - <a href="https://anisha.pizza/"> Anisha</a> and <a href="https://github.com/SwipesForScience/SwipesForScience/blob/master">Andreea</a> - met at the <a href="https://github.com/SwipesForScience/SwipesForScience/blob/master">eLife Innovation Sprint</a> in 2018. You can see their original work and <a href="https://github.com/SwipesForScience/SwipesForScience">template on GitHub</a>.
      </p>
    </b-container>

  </div>

</template>

<style>

#about {
  min-height: 100vh;
}

p {
  text-align: justify;
  padding-top: 0.5em;
  padding-bottom: 1.5em;
}

</style>

<script>
/**
 * This is the about page for the route /about.
 * Right now this page only shows the various badges you can win if you play
 * the game. Eventually, we should fill the content with text that the researcher
 * provides, in markdown.
 */
export default {
  name: 'about',
  data() {
    return {
    };
  },
  props: {
    /**
     * the various levels, the points need to reach the levels,
     * and the badges (colored and greyed out) to display
     */
    levels: {
      type: Object,
      required: false,
    },
  },
};
</script>
