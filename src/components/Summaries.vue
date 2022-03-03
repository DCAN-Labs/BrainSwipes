<template>
  <div id="summaries">
    <h1> Summary </h1>

    <b-container>
      <InterraterConcordance
      :dataset="dataset"
      :db="db"
      :gradientArray="gradientArray"
      />
      <SurvivingSessions
      :dataset="dataset"
      :db="db"
      />
      <UserCorrectness
      :dataset="dataset"
      :db="db"
      :gradientArray="gradientArray"
      />
    </b-container>

  </div>

</template>

<style>
  #summaries {
    padding-bottom: 12vh;
  }
</style>

<script>
  import Vue from 'vue';
  import colorGradient from 'javascript-color-gradient';
  import InterraterConcordance from './Visualizations/InterraterConcordance';
  import SurvivngSessions from './Visualizations/SurvivingSessions';
  import UserCorrectness from './Visualizations/UserCorrectness';

  Vue.component('InterraterConcordance', InterraterConcordance);
  Vue.component('SurvivingSessions', SurvivngSessions);
  Vue.component('UserCorrectness', UserCorrectness);

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
    computed: {
      gradientArray() {
        const gradientArray = colorGradient
          .setGradient('#440155', '#238a8d', '#fde725')
          .setMidpoint(20)
          .getArray();
        return gradientArray;
      },
    },
  };
</script>
