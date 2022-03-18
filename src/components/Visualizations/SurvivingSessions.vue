<template>
  <div v-if="loading">
    LOADING
  </div>
  <div v-else id="survivingSessions">
    <apexchart type="line" height="350" :options="chartOptions" :series="series"></apexchart>
  </div>

</template>

<style>

</style>

<script>
  import Vue from 'vue';
  import VueApexCharts from 'vue-apexcharts';

  Vue.use(VueApexCharts);

  Vue.component('apexchart', VueApexCharts);

  export default {
    name: 'survivingSessions',
    data() {
      return {
        /**
         * elements for building the chart
         */
        chartOptions: {
          chart: {
            height: 350,
            type: 'line',
            toolbar: {
              show: false,
            },
          },
          dataLabels: {
            enabled: false,
          },
          title: {
            text: 'Number of Surviving Sessions at Different Rating Cutoffs',
          },
        },
      };
    },
    props: {
      /**
       * data series for the visualization
       */
      series: {
        type: Array,
        required: true,
      },
      /**
       * is the data for this visualization still loading
       */
      loading: {
        type: Boolean,
        required: true,
      },
    },
  };
</script>