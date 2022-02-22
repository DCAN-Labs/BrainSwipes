<template>
  <div id="summaries">
    <h1> Summary </h1>

    <b-container>
      <InterraterConcordance
      :dataset="dataset"
      :db="db"
      />
      <SurvivingSessions
      :dataset="dataset"
      :db="db"
      />
    </b-container>

  </div>

</template>

<style>

</style>

<script>
  import Vue from 'vue';
  import InterraterConcordance from './Visualizations/InterraterConcordance';
  import SurvivngSessions from './Visualizations/SurvivingSessions';

  Vue.component('InterraterConcordance', InterraterConcordance);
  Vue.component('SurvivingSessions', SurvivngSessions);

  /**
   * Visualizations of summary information.
   */
  export default {
    name: 'summaries',
    data() {
      return {
        test: '',
      };
    },
    props: {
      /**
       * the dataset to swipe on
       */
      dataset: {
        type: String,
        required: true,
      },
      /**
       * the intialized firebase database
       */
      db: {
        type: Object,
        required: true,
      },
    },
  };
</script>
