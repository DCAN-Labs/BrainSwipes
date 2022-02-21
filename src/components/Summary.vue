<template>
  <div id="summary">
    <h1> Summary </h1>

    <b-container>
      <InterraterConcordance />

    </b-container>

  </div>

</template>

<style>

</style>

<script>
  import Vue from 'vue';
  import InterraterConcordance from './Visualizations/InterraterConcordance';

  Vue.component('InterraterConcordance', InterraterConcordance);

  /**
   * Visualizations of summary information.
   */
  export default {
    name: 'summary',
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
    },
  };
</script>
